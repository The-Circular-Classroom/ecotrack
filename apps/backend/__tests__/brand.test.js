const request = require('supertest');

jest.mock('../models/brandService');
const brandService = require('../models/brandService');
const app = require('../app');

describe('Brand API', () => {
  // ── GET /api/brand ─────────────────────────────────────────────────────────
  describe('GET /api/brand', () => {
    it('should return all brands', async () => {
      const mockBrands = [
        { id: 1, brandSupplier: 'Nike', sizeCategories: [] },
        { id: 2, brandSupplier: 'Adidas', sizeCategories: [] },
      ];
      brandService.getAllBrands.mockResolvedValue(mockBrands);

      const res = await request(app).get('/api/brand');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockBrands);
    });

    it('should return 500 on service error', async () => {
      brandService.getAllBrands.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/brand');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/brand/:id ─────────────────────────────────────────────────────
  describe('GET /api/brand/:id', () => {
    it('should return a brand by ID', async () => {
      const mockBrand = { id: 1, brandSupplier: 'Nike' };
      brandService.getBrandById.mockResolvedValue(mockBrand);

      const res = await request(app).get('/api/brand/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockBrand);
    });

    it('should return 404 when brand not found', async () => {
      brandService.getBrandById.mockResolvedValue(null);

      const res = await request(app).get('/api/brand/999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      brandService.getBrandById.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/brand/1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /api/brand ────────────────────────────────────────────────────────
  describe('POST /api/brand', () => {
    it('should create a new brand', async () => {
      const mockBrand = { id: 3, brandSupplier: 'Puma' };
      brandService.createBrand.mockResolvedValue(mockBrand);

      const res = await request(app)
        .post('/api/brand')
        .send({ brand_supplier: 'Puma' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockBrand);
    });

    it('should return 400 when brand_supplier is missing', async () => {
      const res = await request(app)
        .post('/api/brand')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      brandService.createBrand.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/api/brand')
        .send({ brand_supplier: 'Puma' });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── PATCH /api/brand/:id ───────────────────────────────────────────────────
  describe('PATCH /api/brand/:id', () => {
    it('should update a brand', async () => {
      const mockBrand = { id: 1, brandSupplier: 'Nike Updated' };
      brandService.updateBrand.mockResolvedValue(mockBrand);

      const res = await request(app)
        .patch('/api/brand/1')
        .send({ brand_supplier: 'Nike Updated' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockBrand);
    });

    it('should return 400 when brand_supplier is missing', async () => {
      const res = await request(app)
        .patch('/api/brand/1')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      brandService.updateBrand.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .patch('/api/brand/1')
        .send({ brand_supplier: 'Nike Updated' });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── DELETE /api/brand/:id ──────────────────────────────────────────────────
  describe('DELETE /api/brand/:id', () => {
    it('should delete a brand', async () => {
      brandService.getSizeCategoriesByBrandId.mockResolvedValue([]);
      brandService.deleteBrand.mockResolvedValue({});

      const res = await request(app).delete('/api/brand/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app).delete('/api/brand/abc');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 409 when brand has item type references', async () => {
      brandService.getSizeCategoriesByBrandId.mockResolvedValue([
        { itemTypes: [{ id: 1 }], sizeOptions: [] },
      ]);

      const res = await request(app).delete('/api/brand/1');
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should return 409 when brand has transaction/inventory references', async () => {
      brandService.getSizeCategoriesByBrandId.mockResolvedValue([
        { itemTypes: [], sizeOptions: [{ transactions: [{ id: 1 }], inventoryBalances: [] }] },
      ]);

      const res = await request(app).delete('/api/brand/1');
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      brandService.getSizeCategoriesByBrandId.mockResolvedValue([]);
      brandService.deleteBrand.mockRejectedValue(new Error('DB error'));

      const res = await request(app).delete('/api/brand/1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
