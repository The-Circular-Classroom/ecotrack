const request = require('supertest');

jest.mock('../models/sizeService');
const sizeService = require('../models/sizeService');
const app = require('../app');

describe('Size API', () => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  Size Categories
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ── GET /api/size/categories ────────────────────────────────────────────────
  describe('GET /api/size/categories', () => {
    it('should return all size categories', async () => {
      const mockCategories = [
        { id: 1, brandSupplierId: 1, sizeType: 'Numeric' },
        { id: 2, brandSupplierId: 1, sizeType: 'Letter' },
      ];
      sizeService.getAllSizeCategories.mockResolvedValue(mockCategories);

      const res = await request(app).get('/api/size/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockCategories);
    });

    it('should return 404 when no size categories found', async () => {
      sizeService.getAllSizeCategories.mockResolvedValue([]);

      const res = await request(app).get('/api/size/categories');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      sizeService.getAllSizeCategories.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/size/categories');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /api/size/category ─────────────────────────────────────────────────
  describe('POST /api/size/category', () => {
    it('should create a new size category', async () => {
      const mockCategory = { id: 3, brandSupplierId: 1, sizeType: 'EU' };
      sizeService.createSizeCategory.mockResolvedValue(mockCategory);

      const res = await request(app)
        .post('/api/size/category')
        .send({ brand_supplier_id: 1, size_type: 'EU' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockCategory);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/size/category')
        .send({ brand_supplier_id: 1 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      sizeService.createSizeCategory.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/api/size/category')
        .send({ brand_supplier_id: 1, size_type: 'EU' });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── PATCH /api/size/category/:id ────────────────────────────────────────────
  describe('PATCH /api/size/category/:id', () => {
    it('should update a size category', async () => {
      const mockCategory = { id: 1, brandSupplierId: 1, sizeType: 'US' };
      sizeService.updateSizeCategory.mockResolvedValue(mockCategory);

      const res = await request(app)
        .patch('/api/size/category/1')
        .send({ size_type: 'US' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockCategory);
    });

    it('should return 400 when no fields are provided', async () => {
      const res = await request(app)
        .patch('/api/size/category/1')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      sizeService.updateSizeCategory.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .patch('/api/size/category/1')
        .send({ size_type: 'US' });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── DELETE /api/size/category/:id ───────────────────────────────────────────
  describe('DELETE /api/size/category/:id', () => {
    it('should delete a size category', async () => {
      sizeService.deleteSizeCategory.mockResolvedValue({});

      const res = await request(app).delete('/api/size/category/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app).delete('/api/size/category/abc');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      sizeService.deleteSizeCategory.mockRejectedValue(new Error('DB error'));

      const res = await request(app).delete('/api/size/category/1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  Size Options
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ── GET /api/size/options ───────────────────────────────────────────────────
  describe('GET /api/size/options', () => {
    it('should return all size options', async () => {
      const mockOptions = [
        { id: 1, sizeName: 'S', sizeClass: 'Letter', sortOrder: 1 },
        { id: 2, sizeName: 'M', sizeClass: 'Letter', sortOrder: 2 },
      ];
      sizeService.getAllSizeOptions.mockResolvedValue(mockOptions);

      const res = await request(app).get('/api/size/options');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockOptions);
    });

    it('should return 500 on service error', async () => {
      sizeService.getAllSizeOptions.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/size/options');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/size/option/:id ────────────────────────────────────────────────
  describe('GET /api/size/option/:id', () => {
    it('should return a size option by ID', async () => {
      const mockOption = { id: 1, sizeName: 'S', sizeClass: 'Letter', sortOrder: 1 };
      sizeService.getSizeOptionById.mockResolvedValue(mockOption);

      const res = await request(app).get('/api/size/option/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockOption);
    });

    it('should return 404 when size option not found', async () => {
      sizeService.getSizeOptionById.mockResolvedValue(null);

      const res = await request(app).get('/api/size/option/999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      sizeService.getSizeOptionById.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/size/option/1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /api/size/option ───────────────────────────────────────────────────
  describe('POST /api/size/option', () => {
    it('should create a new size option', async () => {
      const mockOption = { id: 3, sizeCategoryId: 1, sizeName: 'L', sizeClass: 'Letter', sortOrder: 3 };
      sizeService.createSizeOption.mockResolvedValue(mockOption);

      const res = await request(app)
        .post('/api/size/option')
        .send({ size_category_id: 1, size_name: 'L', size_class: 'Letter', sort_order: 3 });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockOption);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/size/option')
        .send({ size_category_id: 1 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      sizeService.createSizeOption.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/api/size/option')
        .send({ size_category_id: 1, size_name: 'L', sort_order: 3 });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── PATCH /api/size/option/:id ──────────────────────────────────────────────
  describe('PATCH /api/size/option/:id', () => {
    it('should update a size option', async () => {
      const mockOption = { id: 1, sizeName: 'XS', sizeClass: 'Letter', sortOrder: 0 };
      sizeService.updateSizeOption.mockResolvedValue(mockOption);

      const res = await request(app)
        .patch('/api/size/option/1')
        .send({ size_name: 'XS', sort_order: 0 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockOption);
    });

    it('should return 400 when no fields are provided', async () => {
      const res = await request(app)
        .patch('/api/size/option/1')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      sizeService.updateSizeOption.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .patch('/api/size/option/1')
        .send({ size_name: 'XS' });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── DELETE /api/size/option/:id ─────────────────────────────────────────────
  describe('DELETE /api/size/option/:id', () => {
    it('should delete a size option', async () => {
      sizeService.deleteSizeOption.mockResolvedValue({});

      const res = await request(app).delete('/api/size/option/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app).delete('/api/size/option/abc');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      sizeService.deleteSizeOption.mockRejectedValue(new Error('DB error'));

      const res = await request(app).delete('/api/size/option/1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
