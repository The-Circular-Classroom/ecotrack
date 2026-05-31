import { prisma } from '@/lib/prisma';
import { getSchoolCollectionOverview, getSchoolInventoryByItem, getSchoolItemTypeDetail } from './analytics';

const USER_ROLE_LABELS = {
  SchoolStaff: 'School Staff',
  PsgVolunteer: 'PSG Volunteer',
};

function formatContact(user) {
  return {
    id: user.id,
    name: user.fullName ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
    email: user.email,
    phoneNumber: user.phoneNumber ?? null,
    role: USER_ROLE_LABELS[user.role] ?? user.role,
  };
}

export async function getAllSchools() {
  return prisma.school.findMany({
    orderBy: { schoolName: 'asc' },
    include: {
      _count: { select: { users: true, donationDrives: true, itemTypes: true } },
    },
  });
}

export async function addSchool(input) {
  return prisma.school.create({
    data: {
      schoolName: input.schoolName,
      address: input.address ?? null,
      mrtDesc: input.mrtDesc ?? null,
      dgpCode: input.dgpCode ?? null,
      mainlevelCode: input.mainlevelCode ?? null,
      natureCode: input.natureCode ?? null,
      typeCode: input.typeCode ?? null,
      postalCode: input.postalCode ?? null,
      zoneCode: input.zoneCode ?? null,
      status: input.status ?? null,
      logoUrl: input.logoUrl ?? null,
      isCooperating: input.isCooperating ?? false,
      schoolEmail: input.schoolEmail ?? null,
      schoolNumber: input.schoolNumber ?? null,
    },
  });
}

export async function getSchoolProfile(schoolId) {
  const school = await prisma.school.findUnique({
    where: { id: Number(schoolId) },
    include: {
      users: true,
    },
  });

  if (!school) {
    return null;
  }

  const schoolStaff = school.users.filter((user) => user.role === 'SchoolStaff').map(formatContact);
  const psgVolunteers = school.users.filter((user) => user.role === 'PsgVolunteer').map(formatContact);

  return {
    schoolId: school.id,
    schoolName: school.schoolName,
    address: school.address,
    mrtDesc: school.mrtDesc,
    postalCode: school.postalCode,
    mainlevelCode: school.mainlevelCode,
    natureCode: school.natureCode,
    zoneCode: school.zoneCode,
    status: school.status,
    logoUrl: school.logoUrl,
    isCooperating: school.isCooperating,
    contacts: {
      schoolStaff,
      psgVolunteers,
    },
  };
}

export async function getSchoolDriveList(schoolId) {
  const drives = await prisma.donationDrive.findMany({
    where: { schoolId: Number(schoolId) },
    include: { createdBy: { select: { id: true, fullName: true, role: true } } },
    orderBy: { startDate: 'desc' },
  });

  const now = new Date();
  const result = drives.map((drive) => {
    const start = new Date(drive.startDate);
    const end = new Date(drive.endDate);
    const isActive = start <= now && end >= now;
    const isUpcoming = start > now;
    const isCompleted = end < now;

    return {
      driveId: drive.id,
      driveName: drive.driveName,
      startDate: drive.startDate,
      endDate: drive.endDate,
      location: drive.location,
      status: isActive ? 'active' : isUpcoming ? 'upcoming' : 'completed',
      isActive,
      isUpcoming,
      isCompleted,
      createdBy: drive.createdBy
        ? {
            id: drive.createdBy.id,
            name: drive.createdBy.fullName,
            role: USER_ROLE_LABELS[drive.createdBy.role] ?? drive.createdBy.role,
          }
        : null,
    };
  });

  const summary = {
    total: result.length,
    active: result.filter((drive) => drive.isActive).length,
    upcoming: result.filter((drive) => drive.isUpcoming).length,
    completed: result.filter((drive) => drive.isCompleted).length,
  };

  return { summary, drives: result };
}

export async function getSchoolCollaborations(schoolId) {
  const partnerships = await prisma.schoolPartnership.findMany({
    where: { schoolId: Number(schoolId) },
    orderBy: [{ yearConducted: 'desc' }, { activityName: 'asc' }],
  });

  const byYear = {};
  for (const partnership of partnerships) {
    const year = partnership.yearConducted ?? 'Year unknown';
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push({ id: partnership.id, activityName: partnership.activityName, remarks: partnership.remarks });
  }

  return {
    schoolId: Number(schoolId),
    total: partnerships.length,
    collaborations: partnerships.map((partnership) => ({
      id: partnership.id,
      activityName: partnership.activityName,
      yearConducted: partnership.yearConducted,
      remarks: partnership.remarks,
    })),
    byYear: Object.entries(byYear)
      .sort(([left], [right]) => Number(right) - Number(left))
      .map(([year, activities]) => ({ year, activities })),
  };
}

export async function getSchoolProductsCreated(schoolId) {
  return prisma.product.findMany({
    where: { schoolId: Number(schoolId) },
    orderBy: { id: 'asc' },
    include: {
      productType: true,
      productStyles: {
        include: {
          style: true,
          productRecipes: {
            include: {
              recipeIngredients: true,
            },
          },
        },
      },
    },
  });
}

export async function getSchoolCollectionOverviewById(schoolId) {
  return getSchoolCollectionOverview(Number(schoolId));
}

export async function getSchoolInventoryByItemById(schoolId, { isAdmin = false } = {}) {
  return getSchoolInventoryByItem(Number(schoolId), { isAdmin });
}

export async function getSchoolItemTypeDetailById(schoolId, itemTypeId, { isAdmin = false } = {}) {
  return getSchoolItemTypeDetail(Number(schoolId), Number(itemTypeId), { isAdmin });
}
