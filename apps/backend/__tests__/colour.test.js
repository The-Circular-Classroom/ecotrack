const request = require('supertest');

jest.mock('../models/colourService');
const colourService = require('../models/colourService');
const app = require('../app');

describe('Colour API', () => {
  // ── GET /api/colour ────────────────────────────────────────────────────────
  describe('GET /api/colour', () => {
    it('should return all colours', async () => {
      const mockColours = [
        { id: 1, colourName: 'Red', hexcode: '#FF0000' },
        { id: 2, colourName: 'Blue', hexcode: '#0000FF' },
      ];
      colourService.getAllColours.mockResolvedValue(mockColours);

      const res = await request(app).get('/api/colour');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockColours);
    });

    it('should return 500 on service error', async () => {
      colourService.getAllColours.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/colour');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/colour/:id ────────────────────────────────────────────────────
  describe('GET /api/colour/:id', () => {
    it('should return a colour by ID', async () => {
      const mockColour = { id: 1, colourName: 'Red', hexcode: '#FF0000' };
      colourService.getColourById.mockResolvedValue(mockColour);

      const res = await request(app).get('/api/colour/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockColour);
    });

    it('should return 404 when colour not found', async () => {
      colourService.getColourById.mockResolvedValue(null);

      const res = await request(app).get('/api/colour/999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      colourService.getColourById.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/colour/1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /api/colour ───────────────────────────────────────────────────────
  describe('POST /api/colour', () => {
    it('should create a new colour', async () => {
      const mockColour = { id: 3, colourName: 'Green', hexcode: '#00FF00' };
      colourService.createColour.mockResolvedValue(mockColour);

      const res = await request(app)
        .post('/api/colour')
        .send({ colour_name: 'Green', hexcode: '#00FF00' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockColour);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/colour')
        .send({ colour_name: 'Green' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      colourService.createColour.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/api/colour')
        .send({ colour_name: 'Green', hexcode: '#00FF00' });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── PATCH /api/colour/:id ──────────────────────────────────────────────────
  describe('PATCH /api/colour/:id', () => {
    it('should update a colour', async () => {
      const mockColour = { id: 1, colourName: 'Dark Red', hexcode: '#CC0000' };
      colourService.updateColour.mockResolvedValue(mockColour);

      const res = await request(app)
        .patch('/api/colour/1')
        .send({ colour_name: 'Dark Red', hexcode: '#CC0000' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockColour);
    });

    it('should return 400 when no fields are provided', async () => {
      const res = await request(app)
        .patch('/api/colour/1')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      colourService.updateColour.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .patch('/api/colour/1')
        .send({ colour_name: 'Dark Red' });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── DELETE /api/colour/:id ─────────────────────────────────────────────────
  describe('DELETE /api/colour/:id', () => {
    it('should delete a colour', async () => {
      colourService.deleteColour.mockResolvedValue({});

      const res = await request(app).delete('/api/colour/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app).delete('/api/colour/abc');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      colourService.deleteColour.mockRejectedValue(new Error('DB error'));

      const res = await request(app).delete('/api/colour/1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
