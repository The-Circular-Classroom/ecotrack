// apps/backend/models/userService.js
const prisma = require('../services/database/prismaClient');

/** Prisma UserRole enum values (model-facing, not @map) */
const VALID_USER_ROLES = ['Admin', 'SchoolStaff', 'Parent', 'PsgVolunteer'];

/** Map common request values (lowercase, db-style) to Prisma UserRole */
const ROLE_ALIASES = {
  admin: 'Admin',
  schoolstaff: 'SchoolStaff',
  parent: 'Parent',
  psgvolunteer: 'PsgVolunteer',
};

function toUserRole(value) {
  if (value == null) return 'Admin';
  if (VALID_USER_ROLES.includes(value)) return value;
  const key = String(value).toLowerCase();
  return ROLE_ALIASES[key] || 'Admin';
}

function deriveNamesFromEmail(email) {
  if (!email || !String(email).includes('@')) return { firstName: null, lastName: null, fullName: null };

  const local = String(email).split('@')[0];
  const cleaned = local
    .replace(/[0-9]+/g, '')
    .replace(/[_\-]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/\.$/, '');

  const parts = cleaned.split('.').filter(Boolean);
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : null);

  const firstName = parts[0] ? cap(parts[0]) : null;
  const lastName = parts.length > 1 ? cap(parts[parts.length - 1]) : null;
  const fullName =
    (firstName && lastName ? `${firstName} ${lastName}` : null) ||
    (parts.length ? parts.map(cap).join(' ') : null);

  return { firstName, lastName, fullName };
}

/**
 * Find a user by their Cognito sub (user ID from JWT)
 */
async function findUserByCognitoSub(cognitoSub) {
  return prisma.user.findUnique({
    where: { cognitoSub },
    include: { school: true },
  });
}

/**
 * Find a user by email
 */
async function findUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
    include: { school: true },
  });
}

/**
 * Create a new user in the database
 */
async function createUser({
  cognitoSub,
  email,
  firstName,
  lastName,
  fullName,
  phoneNumber,
  role,
  schoolId,
}) {
  return prisma.user.create({
    data: {
      cognitoSub,
      email,
      firstName: firstName || null,
      lastName: lastName || null,
      fullName: fullName || (firstName && lastName ? `${firstName} ${lastName}` : null),
      phoneNumber: phoneNumber || null,
      role: toUserRole(role),
      isActive: true,
      ...(schoolId ? { school: { connect: { id: Number(schoolId) } } } : {}),
    },
    include: { school: true },
  });
}

/**
 * Update user's last login timestamp
 */
async function updateLastLogin(cognitoSub) {
  return prisma.user.update({
    where: { cognitoSub },
    data: { lastLogin: new Date() },
  });
}

/**
 * Update user's Cognito sub (useful if user was created before Cognito registration)
 */
async function updateCognitoSub(email, cognitoSub) {
  return prisma.user.update({
    where: { email },
    data: { cognitoSub },
  });
}

/**
 * Check if a user exists by email
 */
async function userExistsByEmail(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  return !!user;
}

async function getSchoolIdByUserId(userId) {
  const id = Number(userId);
  if (!Number.isFinite(id)) {
    throw new Error(`Invalid userId provided to getSchoolIdByUserId: ${userId}`);
  }
  return prisma.user.findUnique({
    where: { id },
    select: { schoolId: true },
  });
}

async function getSchoolIdByCognitoSub(cognitoSub) {
  if (!cognitoSub) throw new Error('Invalid cognitoSub provided to getSchoolIdByCognitoSub');
  return prisma.user.findUnique({
    where: { cognitoSub },
    select: { schoolId: true },
  });
}

async function getSchoolIdByEmail(email) {
  if (!email) throw new Error('Invalid email provided to getSchoolIdByEmail');
  return prisma.user.findUnique({
    where: { email },
    select: { schoolId: true },
  });
}

/**
 * NEW: get userId by cognitoSub (for transaction user_id derivation)
 */
async function getUserIdByCognitoSub(cognitoSub) {
  if (!cognitoSub) throw new Error('Invalid cognitoSub');
  const user = await prisma.user.findUnique({
    where: { cognitoSub },
    select: { id: true },
  });
  return user?.id ?? null;
}

/**
 * Ensure a DB user exists for a valid token.
 * Also backfills firstName/lastName/fullName if they are currently null.
 */
async function ensureUserFromToken({ cognitoSub, email, fullName, firstName, lastName, role }) {
  if (!cognitoSub) throw new Error('cognitoSub is required');

  const derived = deriveNamesFromEmail(email);
  const finalFirst = firstName || derived.firstName;
  const finalLast = lastName || derived.lastName;
  const finalFull = fullName || derived.fullName || (finalFirst && finalLast ? `${finalFirst} ${finalLast}` : null);

  // 1) Find by cognitoSub
  let user = await prisma.user.findUnique({
    where: { cognitoSub },
    include: { school: true },
  });

  if (user) {
    // Backfill names if missing
    const needsUpdate =
      (!user.firstName && finalFirst) ||
      (!user.lastName && finalLast) ||
      (!user.fullName && finalFull);

    if (needsUpdate) {
      user = await prisma.user.update({
        where: { cognitoSub },
        data: {
          firstName: user.firstName || finalFirst || null,
          lastName: user.lastName || finalLast || null,
          fullName: user.fullName || finalFull || null,
        },
        include: { school: true },
      });
    }
    return user;
  }

  // 2) If not found, try link by email
  if (email) {
    user = await prisma.user.findUnique({
      where: { email },
      include: { school: true },
    });

    if (user) {
      // Backfill cognitoSub + names if missing
      const updateData = {
        ...(user.cognitoSub ? {} : { cognitoSub }),
        ...(user.firstName ? {} : finalFirst ? { firstName: finalFirst } : {}),
        ...(user.lastName ? {} : finalLast ? { lastName: finalLast } : {}),
        ...(user.fullName ? {} : finalFull ? { fullName: finalFull } : {}),
      };

      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { email },
          data: updateData,
          include: { school: true },
        });
      }

      if (user.cognitoSub === cognitoSub) {
        return prisma.user.findUnique({
          where: { cognitoSub },
          include: { school: true },
        });
      }
      return user;
    }
  }

  // 3) Create user with names
  const created = await prisma.user.create({
    data: {
      cognitoSub,
      email: email || `${cognitoSub}@unknown.local`,
      phoneNumber: null,
      firstName: finalFirst || null,
      lastName: finalLast || null,
      fullName: finalFull || null,
      role: toUserRole(role),
      isActive: true,
      numberChild: null,
      childDetails: null,
      schoolId: null,
    },
    include: { school: true },
  });

  return created;
}

async function getUserNamebyId(user_id){
  if (!user_id) return null;

  const user = await prisma.user.findUnique({
    where: { id: user_id },
    select: { firstName: true, lastName: true, email: true },
  });

  return user;
}

module.exports = {
  findUserByCognitoSub,
  findUserByEmail,
  createUser,
  updateLastLogin,
  updateCognitoSub,
  userExistsByEmail,
  getSchoolIdByUserId,
  getSchoolIdByCognitoSub,
  getSchoolIdByEmail,
  getUserIdByCognitoSub,
  ensureUserFromToken,
  getUserNamebyId,
};