const request = require('supertest');

jest.mock('../models/patternService');
const patternService = require('../models/patternService');
const app = require('../app');

describe('Pattern API', () => {
  // ── GET /api/pattern ───────────────────────────────────────────────────────
  describe('GET /api/pattern', () => {
    it('should return all patterns', async () => {
      const mockPatterns = [
        { id: 1, patternName: 'Striped' },
        { id: 2, patternName: 'Checked' },
      ];
      patternService.getAllPatterns.mockResolvedValue(mockPatterns);

      const res = await request(app).get('/api/pattern');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockPatterns);
    });

    it('should return 500 on service error', async () => {
      patternService.getAllPatterns.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/pattern');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/pattern/:id ───────────────────────────────────────────────────
  describe('GET /api/pattern/:id', () => {
    it('should return a pattern by ID', async () => {
      const mockPattern = { id: 1, patternName: 'Striped' };
      patternService.getPatternById.mockResolvedValue(mockPattern);

      const res = await request(app).get('/api/pattern/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockPattern);
    });

    it('should return 404 when pattern not found', async () => {
      patternService.getPatternById.mockResolvedValue(null);

      const res = await request(app).get('/api/pattern/999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      patternService.getPatternById.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/pattern/1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /api/pattern ──────────────────────────────────────────────────────
  describe('POST /api/pattern', () => {
    it('should create a new pattern', async () => {
      const mockPattern = { id: 3, patternName: 'Polka Dot' };
      patternService.createPattern.mockResolvedValue(mockPattern);

      const res = await request(app)
        .post('/api/pattern')
        .send({ pattern_name: 'Polka Dot' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockPattern);
    });

    it('should return 400 when pattern_name is missing', async () => {
      const res = await request(app)
        .post('/api/pattern')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      patternService.createPattern.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/api/pattern')
        .send({ pattern_name: 'Polka Dot' });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── PATCH /api/pattern/:id ─────────────────────────────────────────────────
  describe('PATCH /api/pattern/:id', () => {
    it('should update a pattern', async () => {
      const mockPattern = { id: 1, patternName: 'Wide Striped' };
      patternService.updatePattern.mockResolvedValue(mockPattern);

      const res = await request(app)
        .patch('/api/pattern/1')
        .send({ pattern_name: 'Wide Striped' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockPattern);
    });

    it('should return 400 when pattern_name is missing', async () => {
      const res = await request(app)
        .patch('/api/pattern/1')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      patternService.updatePattern.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .patch('/api/pattern/1')
        .send({ pattern_name: 'Wide Striped' });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── DELETE /api/pattern/:id ────────────────────────────────────────────────
  describe('DELETE /api/pattern/:id', () => {
    it('should delete a pattern', async () => {
      patternService.deletePattern.mockResolvedValue({});

      const res = await request(app).delete('/api/pattern/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app).delete('/api/pattern/abc');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      patternService.deletePattern.mockRejectedValue(new Error('DB error'));

      const res = await request(app).delete('/api/pattern/1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
