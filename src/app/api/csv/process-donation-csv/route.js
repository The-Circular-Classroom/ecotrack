import { getRequestContext } from '@/lib/request-context';
import { storeCsvArtifact, validateDonationCsvBuffer } from '@/lib/data/csv';

export const runtime = 'nodejs';

export async function POST(request) {
  const context = await getRequestContext(request);
  if (!context.isAuthenticated) {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || typeof file.arrayBuffer !== 'function') {
    return Response.json({ success: false, message: 'No file uploaded' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await validateDonationCsvBuffer(buffer, file.name, { requestingUser: context.user });

  const storageFolder = result.success ? 'validated' : 'failed';
  const storage = await storeCsvArtifact({
    folder: storageFolder,
    fileName: file.name,
    buffer,
    contentType: file.type || 'application/octet-stream',
  }).catch(() => null);

  return Response.json({
    ...result,
    s3: storage
      ? { originalKey: storage.path, newKey: storage.path, newLocation: null, status: storageFolder }
      : null,
  });
}