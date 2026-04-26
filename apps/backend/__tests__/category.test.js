const request = require('supertest');

jest.mock('../models/categoryService');
const categoryService = require('../models/categoryService');
const app = require('../app');

describe('Category API', () => {
  // ── GET /api/category ──────────────────────────────────────────────────────
  describe('GET /api/category', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { id: 1, categoryName: 'Tops', weightKg: 0.3 },
        { id: 2, categoryName: 'Bottoms', weightKg: 0.5 },
      ];
      categoryService.getAllCategories.mockResolvedValue(mockCategories);

      const res = await request(app).get('/api/category');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockCategories);
    });

    it('should return 500 on service error', async () => {
      categoryService.getAllCategories.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/category');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/category/:id ──────────────────────────────────────────────────
  describe('GET /api/category/:id', () => {
    it('should return a category by ID', async () => {
      const mockCategory = { id: 1, categoryName: 'Tops', weightKg: 0.3 };
      categoryService.getCategoryById.mockResolvedValue(mockCategory);

      const res = await request(app).get('/api/category/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockCategory);
    });

    it('should return 404 when category not found', async () => {
      categoryService.getCategoryById.mockResolvedValue(null);

      const res = await request(app).get('/api/category/999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      categoryService.getCategoryById.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/category/1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /api/category ─────────────────────────────────────────────────────
  describe('POST /api/category', () => {
    it('should create a new category', async () => {
      const mockCategory = { id: 3, categoryName: 'Shoes', weightKg: 0.8 };
      categoryService.createCategory.mockResolvedValue(mockCategory);

      const res = await request(app)
        .post('/api/category')
        .send({ category_name: 'Shoes', weight_kg: 0.8 });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockCategory);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/category')
        .send({ category_name: 'Shoes' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when category_name is missing', async () => {
      const res = await request(app)
        .post('/api/category')
        .send({ weight_kg: 0.8 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      categoryService.createCategory.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/api/category')
        .send({ category_name: 'Shoes', weight_kg: 0.8 });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── PATCH /api/category/:id ────────────────────────────────────────────────
  describe('PATCH /api/category/:id', () => {
    it('should update a category', async () => {
      const mockCategory = { id: 1, categoryName: 'Updated Tops', weightKg: 0.35 };
      categoryService.updateCategory.mockResolvedValue(mockCategory);

      const res = await request(app)
        .patch('/api/category/1')
        .send({ category_name: 'Updated Tops', weight_kg: 0.35 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockCategory);
    });

    it('should return 400 when no fields are provided', async () => {
      const res = await request(app)
        .patch('/api/category/1')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      categoryService.updateCategory.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .patch('/api/category/1')
        .send({ category_name: 'Updated Tops' });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── DELETE /api/category/:id ───────────────────────────────────────────────
  describe('DELETE /api/category/:id', () => {
    it('should delete a category', async () => {
      categoryService.deleteCategory.mockResolvedValue({});

      const res = await request(app).delete('/api/category/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app).delete('/api/category/abc');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      categoryService.deleteCategory.mockRejectedValue(new Error('DB error'));

      const res = await request(app).delete('/api/category/1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
