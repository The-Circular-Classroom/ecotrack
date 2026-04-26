const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

// Initialize S3Client using AWS SDK's default credential provider chain
// Credentials loaded from environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
});

const getContentTypeFromExtension = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  const contentTypeMap = {
    // Spreadsheets
    '.csv': 'text/csv',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
  };
  return contentTypeMap[ext] || 'application/octet-stream';
};

const uploadToS3 = async (fileBuffer, s3Key, bucketName) => {
  const contentType = getContentTypeFromExtension(s3Key);

  const params = {
    Bucket: bucketName,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: contentType,
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    const region = process.env.AWS_REGION || 'ap-southeast-1';
    const encodedKey = encodeURIComponent(s3Key).replace(/%2F/g, '/');

    return {
      success: true,
      location: `https://${bucketName}.s3.${region}.amazonaws.com/${encodedKey}`,
      key: s3Key,
      bucket: bucketName,
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

const listObjects = async (prefix, bucketName) => {
  const bucket = bucketName || process.env.S3_BUCKET_NAME;
  if (!bucket) {
    throw new Error('S3 bucket not configured. Set S3_BUCKET_NAME or pass bucketName.');
  }
  const normalizedPrefix = prefix.replace(/^\/+/, '');
  const allObjects = [];
  let continuationToken = undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: normalizedPrefix,
      ContinuationToken: continuationToken,
    });

    const response = await s3Client.send(command);
    const contents = response.Contents || [];

    // Filter out "folder" placeholder keys
    const files = contents.filter((obj) => !obj.Key.endsWith("/"));
    allObjects.push(...files);

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return allObjects;
};

const downloadFile = async (key, bucketName) => {
  const bucket = bucketName || process.env.S3_BUCKET_NAME;
  if (!bucket) {
    throw new Error('S3 bucket not configured. Set S3_BUCKET_NAME or pass bucketName.');
  }
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await s3Client.send(command);

  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
};

const copyObject = async (sourceKey, destKey, bucketName, userId) => {
  const bucket = bucketName || process.env.S3_BUCKET_NAME;
  if (!bucket) {
    throw new Error('S3 bucket not configured. Set S3_BUCKET_NAME or pass bucketName.');
  }
  const normalizedSource = sourceKey.replace(/^\/+/, '');
  const normalizedDest = destKey.replace(/^\/+/, '');
  const copySource = `${bucket}/${normalizedSource}`;

  const command = new CopyObjectCommand({
    Bucket: bucket,
    CopySource: copySource,
    Key: normalizedDest,
    Metadata:{
      'approver_user_id': String(userId),
    },
    MetadataDirective: 'REPLACE',
  });
  await s3Client.send(command);
  return { key: normalizedDest, bucket };
};

const deleteObject = async (key, bucketName) => {
  const bucket = bucketName || process.env.S3_BUCKET_NAME;
  if (!bucket) {
    throw new Error('S3 bucket not configured. Set S3_BUCKET_NAME or pass bucketName.');
  }
  const normalizedKey = key.replace(/^\/+/, '');
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: normalizedKey,
  });
  await s3Client.send(command);
};

const moveObject = async (sourceKey, destKey, bucketName, userId) => {
  const result = await copyObject(sourceKey, destKey, bucketName, userId);

  try {
    await deleteObject(sourceKey, bucketName);
  } catch (error) {
    // Attempt to roll back the copy to avoid leaving the object in both locations
    try {
      await deleteObject(destKey, bucketName);
    } catch (rollbackError) {
      // If rollback fails, log the situation but still surface the original error
      console.error('Failed to rollback S3 move operation', {
        sourceKey,
        destKey,
        bucketName,
        originalError: error,
        rollbackError,
      });
    }
    throw error;
  }
  return result;
};

const deleteFromS3 = async (imageUrl, bucketName) => {
  // Extract the S3 key from the URL
  // e.g. https://bucket.s3.ap-southeast-1.amazonaws.com/presets/images/123_file.jpg → presets/images/123_file.jpg
  const key = decodeURIComponent(imageUrl.split('.amazonaws.com/')[1]);

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
};

module.exports = {
  uploadToS3,
  listObjects,
  downloadFile,
  copyObject,
  deleteObject,
  moveObject,
  deleteFromS3
};
