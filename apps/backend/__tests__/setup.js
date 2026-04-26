/**
 * Jest shared setup — runs before each test file.
 *
 * Mocks:
 *  1. Cognito JWT middleware → pass-through (no real token verification)
 *  2. Prisma client → never imported in tests (model services are mocked per-file)
 *
 * Environment:
 *  - Suppresses console.error/warn to keep test output clean
 */

// ── Mock Cognito JWT middleware ──────────────────────────────────────────────
// This MUST be hoisted before any `require('../../app')` so the route
// registrations pick up the stubbed middleware.
jest.mock('../middlewares/cognitoJwt', () => ({
  verifyAccessToken: (req, res, next) => {
    req.user = { sub: 'test-cognito-sub', 'cognito:groups': ['TCCAdministrators'] };
    next();
  },
  verifyAccessTokenAndAssertParentSupportGroupRole: (req, res, next) => {
    req.user = { sub: 'test-cognito-sub', 'cognito:groups': ['ParentSupportGroup'] };
    next();
  },
  verifyAccessTokenAndAssertParentSupportGroupAndAbove: (req, res, next) => {
    req.user = { sub: 'test-cognito-sub', 'cognito:groups': ['ParentSupportGroup'] };
    next();
  },
  verifyAccessTokenAndAssertSchoolStaffRole: (req, res, next) => {
    req.user = { sub: 'test-cognito-sub', 'cognito:groups': ['SchoolStaff'] };
    next();
  },
  verifyAccessTokenAndAssertSchoolStaffAndAbove: (req, res, next) => {
    req.user = { sub: 'test-cognito-sub', 'cognito:groups': ['SchoolStaff'] };
    next();
  },
  verifyAccessTokenAndAssertTCCAdministratorRole: (req, res, next) => {
    req.user = { sub: 'test-cognito-sub', 'cognito:groups': ['TCCAdministrators'] };
    next();
  },
}));

// ── Mock Prisma client ─────────────────────────────────────────────────────
// The model services import prismaClient. We mock it at this level so
// no real DB connection is attempted when app.js is required.
jest.mock('../services/database/prismaClient', () => ({
  $transaction: jest.fn(),
  brandSupplier: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  category: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  colour: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  material: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  pattern: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  tag: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  itemTypeTag: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
  sizeCategory: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
  sizeOption: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
  itemType: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  itemTypePreset: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  transaction: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), count: jest.fn() },
  inventoryBalance: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), upsert: jest.fn() },
  donationDrive: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  user: { findUnique: jest.fn(), findFirst: jest.fn() },
  school: { findMany: jest.fn(), findUnique: jest.fn() },
}));

// ── Silence noisy logs during tests ─────────────────────────────────────────
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
  console.warn.mockRestore();
  console.log.mockRestore();
});
