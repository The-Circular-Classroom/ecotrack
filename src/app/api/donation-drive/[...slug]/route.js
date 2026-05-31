import { getRequestContext } from '@/lib/request-context';
import {
  approveDonationCsvRows,
  buildDonationCsvTemplate,
  getActiveDonationDrives,
  getDonationDriveById,
  getDonationDrivesBySchool,
  getFailedDonationFiles,
  getPendingDonationFiles,
  getValidatedDonationFileContent,
  getValidatedDonationFiles,
  moveCsvArtifact,
  storeCsvArtifact,
  validateDonationCsvBuffer,
} from '@/lib/data/donation-drives';
import { createTransaction } from '@/lib/data/transactions';
import { deleteDonationDrive, updateDonationDrive } from '@/lib/data/donation-drives';

export const runtime = 'nodejs';

async function readFormFile(request) {
  const formData = await request.formData();
  const file = formData.get('file');
  if (!file || typeof file.arrayBuffer !== 'function') {
    return null;
  }

  return file;
}

export async function GET(request, { params }) {
  const slug = params.slug || [];
  const head = slug[0];

  if (head === 'active') {
    return Response.json({ success: true, data: await getActiveDonationDrives() });
  }

  if (head === 'school' && slug[1]) {
    return Response.json({ success: true, data: await getDonationDrivesBySchool(slug[1]) });
  }

  if (head === 'validated-files') {
    if (slug[1] === 'content') {
      const url = new URL(request.url);
      const key = url.searchParams.get('key');
      return Response.json({ success: true, data: await getValidatedDonationFileContent(key) });
    }

    return Response.json({ success: true, data: await getValidatedDonationFiles() });
  }

  if (head === 'pending-files') {
    return Response.json({ success: true, data: await getPendingDonationFiles() });
  }

  if (head === 'failed-files') {
    return Response.json({ success: true, data: await getFailedDonationFiles() });
  }

  if (slug[1] === 'csv-template') {
    return new Response(buildDonationCsvTemplate(), {
      headers: { 'content-type': 'text/csv; charset=utf-8' },
    });
  }

  if (head) {
    return Response.json({ success: true, data: await getDonationDriveById(head) });
  }

  return Response.json({ success: false, message: 'Not found' }, { status: 404 });
}

export async function PATCH(request, { params }) {
  const context = await getRequestContext(request);
  if (!context.isAuthenticated) {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const data = await updateDonationDrive(params.slug?.[0], body);
  return Response.json({ success: true, data });
}

export async function DELETE(request, { params }) {
  const context = await getRequestContext(request);
  if (!context.isAuthenticated) {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const data = await deleteDonationDrive(params.slug?.[0]);
  return Response.json({ success: true, data });
}

export async function POST(request, { params }) {
  const slug = params.slug || [];
  const head = slug[0];

  if (head === 'approve-file' || head === 'deny-file') {
    const context = await getRequestContext(request);
    if (!context.isAuthenticated || context.role !== 'Admin') {
      return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const from = body.from || body.key;
    const to = body.to || (head === 'approve-file' ? from?.replace('/pending/', '/validated/') : from?.replace('/pending/', '/failed/'));
    const data = await moveCsvArtifact({ from, to });
    return Response.json({ success: true, data });
  }

  if (head === 'upload-csv') {
    const context = await getRequestContext(request);
    if (!context.isAuthenticated) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const file = await readFormFile(request);
    if (!file) {
      return Response.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await validateDonationCsvBuffer(buffer, file.name, { requestingUser: context.user });
    const storage = await storeCsvArtifact({
      folder: result.success ? 'validated' : 'failed',
      fileName: file.name,
      buffer,
      contentType: file.type || 'application/octet-stream',
    }).catch(() => null);

    return Response.json({ success: true, ...result, s3: storage });
  }

  if (head === 'donate') {
    const context = await getRequestContext(request);
    if (!context.isAuthenticated || !context.userId) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = await createTransaction({
      ...body,
      user_id: context.userId,
    });
    return Response.json({ success: true, data }, { status: 201 });
  }

  if (head === 'approved') {
    const context = await getRequestContext(request);
    if (!context.isAuthenticated || !context.userId) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = await approveDonationCsvRows(body.enrichedRows || body.rows || [], { approverUserId: context.userId });
    return Response.json({ success: true, data }, { status: 201 });
  }

  return Response.json({ success: false, message: 'Not found' }, { status: 404 });
}