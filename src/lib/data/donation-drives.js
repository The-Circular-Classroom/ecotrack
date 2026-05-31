import { prisma } from '@/lib/prisma';
import {
  approveDonationCsvRows,
  buildDonationCsvTemplate,
  listCsvArtifacts,
  moveCsvArtifact,
  readCsvArtifact,
  storeCsvArtifact,
  validateDonationCsvBuffer,
} from './csv';

function donationDriveInclude() {
  return {
    school: { select: { id: true, schoolName: true, logoUrl: true } },
    createdBy: { select: { id: true, firstName: true, lastName: true, role: true } },
    _count: { select: { transactions: true } },
  };
}

function parseDriveInput(input = {}) {
  return {
    driveName: input.driveName ?? input.drive_name,
    startDate: input.startDate ?? input.start_date,
    endDate: input.endDate ?? input.end_date,
    location: input.location,
    schoolId: input.schoolId ?? input.school_id ?? null,
  };
}

export async function listDonationDrives({ schoolId } = {}) {
  return prisma.donationDrive.findMany({
    where: schoolId ? { schoolId: Number(schoolId) } : undefined,
    orderBy: { startDate: 'desc' },
    include: donationDriveInclude(),
  });
}

export async function getActiveDonationDrives() {
  const now = new Date();
  return prisma.donationDrive.findMany({
    where: { startDate: { lte: now }, endDate: { gte: now } },
    orderBy: { startDate: 'desc' },
    include: donationDriveInclude(),
  });
}

export async function getDonationDrivesBySchool(schoolId) {
  return listDonationDrives({ schoolId });
}

export async function getDonationDriveById(id) {
  return prisma.donationDrive.findUnique({
    where: { id: Number(id) },
    include: donationDriveInclude(),
  });
}

export async function createDonationDrive(input, createdByUserId) {
  const parsed = parseDriveInput(input);

  return prisma.donationDrive.create({
    data: {
      driveName: parsed.driveName,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
      location: parsed.location,
      schoolId: parsed.schoolId ? Number(parsed.schoolId) : null,
      createdByUserId,
    },
    include: donationDriveInclude(),
  });
}

export async function updateDonationDrive(id, input) {
  const parsed = parseDriveInput(input);

  return prisma.donationDrive.update({
    where: { id: Number(id) },
    data: {
      ...(parsed.driveName ? { driveName: parsed.driveName } : {}),
      ...(parsed.startDate ? { startDate: new Date(parsed.startDate) } : {}),
      ...(parsed.endDate ? { endDate: new Date(parsed.endDate) } : {}),
      ...(parsed.location ? { location: parsed.location } : {}),
      ...(parsed.schoolId ? { schoolId: Number(parsed.schoolId) } : {}),
    },
    include: donationDriveInclude(),
  });
}

export async function deleteDonationDrive(id) {
  return prisma.donationDrive.delete({ where: { id: Number(id) } });
}

export async function getValidatedDonationFiles(options = {}) {
  return listCsvArtifacts({ ...options, folder: 'validated' });
}

export async function getFailedDonationFiles(options = {}) {
  return listCsvArtifacts({ ...options, folder: 'failed' });
}

export async function getPendingDonationFiles(options = {}) {
  return listCsvArtifacts({ ...options, folder: 'pending' });
}

export async function getValidatedDonationFileContent(key, options = {}) {
  return readCsvArtifact({ ...options, key });
}

export async function approveValidatedDonationFile(from, to, options = {}) {
  return moveCsvArtifact({ ...options, from, to });
}

export {
  approveDonationCsvRows,
  buildDonationCsvTemplate,
  moveCsvArtifact,
  storeCsvArtifact,
  validateDonationCsvBuffer,
};