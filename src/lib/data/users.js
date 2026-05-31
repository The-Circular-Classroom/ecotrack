import { prisma } from '@/lib/prisma';

export async function upsertCurrentUserFromAuthUser(authUser) {
  if (!authUser?.id || !authUser?.email) {
    return null;
  }

  const fullName = authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null;
  const firstName = authUser.user_metadata?.first_name ?? authUser.user_metadata?.given_name ?? null;
  const lastName = authUser.user_metadata?.last_name ?? authUser.user_metadata?.family_name ?? null;

  return prisma.user.upsert({
    where: { id: authUser.id },
    create: {
      id: authUser.id,
      email: authUser.email,
      firstName,
      lastName,
      fullName,
      isActive: true,
      lastLogin: new Date(),
    },
    update: {
      email: authUser.email,
      firstName,
      lastName,
      fullName,
      lastLogin: new Date(),
    },
    include: {
      school: true,
    },
  });
}

export async function getUserRecordForAuthUser(authUser) {
  if (!authUser?.id) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: authUser.id },
    include: { school: true },
  });
}

export async function listUsers({ page = 1, limit = 10, username = '' } = {}) {
  const normalizedLimit = Math.min(Math.max(limit, 1), 100);
  const skip = (page - 1) * normalizedLimit;
  const where = username
    ? {
        email: {
          contains: username,
          mode: 'insensitive',
        },
      }
    : undefined;

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      skip,
      take: normalizedLimit,
      where,
      orderBy: { id: 'asc' },
      include: { school: true },
    }),
  ]);

  return {
    data: users,
    total,
    page,
    limit: normalizedLimit,
    username: username || null,
  };
}

export async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: { school: true },
  });
}