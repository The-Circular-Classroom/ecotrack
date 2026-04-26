const request = require('supertest');

jest.mock('../models/inventoryService');
jest.mock('../models/transactionService');
jest.mock('../models/userService');
jest.mock('../services/database/prismaClient');

const inventoryService = require('../models/inventoryService');
const transactionService = require('../models/transactionService');
const userService = require('../models/userService');
const prisma = require('../services/database/prismaClient');
const app = require('../app');

/*
 * The inventory controller checks isTccAdmin(req) using req.user['cognito:groups'].
 * Our setup.js mock for verifyAccessTokenAndAssertParentSupportGroupAndAbove sets
 * groups to ['ParentSupportGroup']. For non-admin users the controller falls back
 * to getRequestingUserSchoolId() which calls userService.findUserByCognitoSub().
 * We mock that to return a user with schoolId so the non-admin path works.
 */

describe('Inventory API', () => {
  beforeEach(() => {
    // Default: non-admin user with schoolId 1
    userService.findUserByCognitoSub.mockResolvedValue({ id: 42, schoolId: 1 });
    userService.getUserIdByCognitoSub.mockResolvedValue(42);
  });

  // ── GET /api/inventory ─────────────────────────────────────────────────────
  describe('GET /api/inventory', () => {
    it('should return filtered inventory for PSG user', async () => {
      const mockInventory = [
        { id: 1, itemTypeId: 1, quantity: 10 },
      ];
      prisma.inventoryBalance.findMany.mockResolvedValue(mockInventory);

      const res = await request(app).get('/api/inventory');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockInventory);
    });

    it('should return 403 when user has no school', async () => {
      userService.findUserByCognitoSub.mockResolvedValue({ id: 42, schoolId: null });

      const res = await request(app).get('/api/inventory');
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      prisma.inventoryBalance.findMany.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/inventory');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/inventory/balances ────────────────────────────────────────────
  describe('GET /api/inventory/balances', () => {
    it('should return inventory balances for PSG user (school-scoped)', async () => {
      const mockBalances = [
        { id: 1, itemTypeId: 1, quantity: 10, itemStatus: 'ForSale' },
      ];
      prisma.inventoryBalance.findMany.mockResolvedValue(mockBalances);

      const res = await request(app).get('/api/inventory/balances');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockBalances);
    });

    it('should accept filter query params', async () => {
      prisma.inventoryBalance.findMany.mockResolvedValue([]);

      const res = await request(app).get(
        '/api/inventory/balances?storedAt=school&itemStatus=ForSale',
      );
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
    });

    it('should return 403 when user has no school', async () => {
      userService.findUserByCognitoSub.mockResolvedValue({ id: 42, schoolId: null });

      const res = await request(app).get('/api/inventory/balances');
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      prisma.inventoryBalance.findMany.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/inventory/balances');
      expect(res.status).toBe(500);
    });
  });

  // ── GET /api/inventory/:schoolId ───────────────────────────────────────────
  describe('GET /api/inventory/:schoolId', () => {
    it('should return school inventory for matching school user', async () => {
      const mockRows = [
        {
          id: 1,
          itemTypeId: 1,
          quantity: 10,
          itemStatus: 'ForSale',
          storedAt: 'school',
          lastUpdated: '2025-01-01',
          itemType: {
            category: { categoryName: 'Tops' },
            primaryColour: null,
            secondaryColour: null,
            pattern: null,
            material: null,
            sizeCategory: null,
          },
          sizeOption: { id: 1, sizeName: 'S' },
        },
      ];
      prisma.inventoryBalance.findMany.mockResolvedValue(mockRows);

      const res = await request(app).get('/api/inventory/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.countItemTypes).toBe(1);
    });

    it('should return 403 when accessing another schools inventory', async () => {
      // User is at school 1, trying to access school 2
      const res = await request(app).get('/api/inventory/2');
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 when user has no school', async () => {
      userService.findUserByCognitoSub.mockResolvedValue({ id: 42, schoolId: null });

      const res = await request(app).get('/api/inventory/1');
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      prisma.inventoryBalance.findMany.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/inventory/1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── PATCH /api/inventory/update-item-condition ─────────────────────────────
  describe('PATCH /api/inventory/update-item-condition', () => {
    const validItem = {
      item_type_id: 1,
      from_status: 'ForSale',
      to_status: 'Damaged',
      from_quantity: 10,
      remove_quantity: 2,
      size_option_id: 1,
      from_stored_at: 'school',
      stored_at: 'school',
      remarks: 'test',
    };

    it('should update inventory item condition', async () => {
      const mockTxs = [{ id: 1 }];
      transactionService.createTransaction.mockResolvedValue(mockTxs);

      const res = await request(app)
        .patch('/api/inventory/update-item-condition')
        .send({ itemsToUpdate: [validItem] });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when no items provided', async () => {
      const res = await request(app)
        .patch('/api/inventory/update-item-condition')
        .send({ itemsToUpdate: [] });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when itemsToUpdate is not an array', async () => {
      const res = await request(app)
        .patch('/api/inventory/update-item-condition')
        .send({ itemsToUpdate: 'not-an-array' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 when user not found', async () => {
      userService.getUserIdByCognitoSub.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/inventory/update-item-condition')
        .send({ itemsToUpdate: [validItem] });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when item is missing required fields', async () => {
      const res = await request(app)
        .patch('/api/inventory/update-item-condition')
        .send({ itemsToUpdate: [{ item_type_id: 1 }] });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when trying to remove more than available', async () => {
      const res = await request(app)
        .patch('/api/inventory/update-item-condition')
        .send({
          itemsToUpdate: [{
            ...validItem,
            from_quantity: 2,
            remove_quantity: 5,
          }],
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on unexpected service error', async () => {
      transactionService.createTransaction.mockRejectedValue(new Error('Connection lost'));

      const res = await request(app)
        .patch('/api/inventory/update-item-condition')
        .send({ itemsToUpdate: [validItem] });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 on validation error from transaction service', async () => {
      transactionService.createTransaction.mockRejectedValue(
        new Error('Insufficient inventory balance'),
      );

      const res = await request(app)
        .patch('/api/inventory/update-item-condition')
        .send({ itemsToUpdate: [validItem] });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
