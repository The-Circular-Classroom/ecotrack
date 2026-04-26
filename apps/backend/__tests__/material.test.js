const request = require('supertest');

jest.mock('../models/materialService');
const materialService = require('../models/materialService');
const app = require('../app');

describe('Material API', () => {
  // ── GET /api/material ──────────────────────────────────────────────────────
  describe('GET /api/material', () => {
    it('should return all materials', async () => {
      const mockMaterials = [
        { id: 1, materialName: 'Cotton' },
        { id: 2, materialName: 'Polyester' },
      ];
      materialService.getAllMaterials.mockResolvedValue(mockMaterials);

      const res = await request(app).get('/api/material');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockMaterials);
    });

    it('should return 500 on service error', async () => {
      materialService.getAllMaterials.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/material');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/material/:id ──────────────────────────────────────────────────
  describe('GET /api/material/:id', () => {
    it('should return a material by ID', async () => {
      const mockMaterial = { id: 1, materialName: 'Cotton' };
      materialService.getMaterialById.mockResolvedValue(mockMaterial);

      const res = await request(app).get('/api/material/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockMaterial);
    });

    it('should return 404 when material not found', async () => {
      materialService.getMaterialById.mockResolvedValue(null);

      const res = await request(app).get('/api/material/999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      materialService.getMaterialById.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/material/1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /api/material ─────────────────────────────────────────────────────
  describe('POST /api/material', () => {
    it('should create a new material', async () => {
      const mockMaterial = { id: 3, materialName: 'Silk' };
      materialService.createMaterial.mockResolvedValue(mockMaterial);

      const res = await request(app)
        .post('/api/material')
        .send({ material_name: 'Silk' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockMaterial);
    });

    it('should return 400 when material_name is missing', async () => {
      const res = await request(app)
        .post('/api/material')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      materialService.createMaterial.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/api/material')
        .send({ material_name: 'Silk' });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── PATCH /api/material/:id ────────────────────────────────────────────────
  describe('PATCH /api/material/:id', () => {
    it('should update a material', async () => {
      const mockMaterial = { id: 1, materialName: 'Organic Cotton' };
      materialService.updateMaterial.mockResolvedValue(mockMaterial);

      const res = await request(app)
        .patch('/api/material/1')
        .send({ material_name: 'Organic Cotton' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockMaterial);
    });

    it('should return 400 when material_name is missing', async () => {
      const res = await request(app)
        .patch('/api/material/1')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      materialService.updateMaterial.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .patch('/api/material/1')
        .send({ material_name: 'Organic Cotton' });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── DELETE /api/material/:id ───────────────────────────────────────────────
  describe('DELETE /api/material/:id', () => {
    it('should delete a material', async () => {
      materialService.deleteMaterial.mockResolvedValue({});

      const res = await request(app).delete('/api/material/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app).delete('/api/material/abc');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      materialService.deleteMaterial.mockRejectedValue(new Error('DB error'));

      const res = await request(app).delete('/api/material/1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
