const request = require('supertest');
const app = require('../app');

describe('Health & 404', () => {
  describe('GET /health', () => {
    it('should return 200 with status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404', async () => {
      const res = await request(app).get('/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not found');
    });
  });
});
