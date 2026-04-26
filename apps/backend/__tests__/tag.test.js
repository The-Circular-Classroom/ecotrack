const request = require('supertest');

jest.mock('../models/tagService');
jest.mock('../models/userService');
const tagService = require('../models/tagService');
const userService = require('../models/userService');
const app = require('../app');

describe('Tag API', () => {
  // ── GET /api/tag ───────────────────────────────────────────────────────────
  describe('GET /api/tag', () => {
    it('should return all tags', async () => {
      const mockTags = [
        { id: 1, tagName: 'Sustainable', isActive: true },
        { id: 2, tagName: 'Recycled', isActive: true },
      ];
      tagService.getAllTags.mockResolvedValue(mockTags);

      const res = await request(app).get('/api/tag');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockTags);
    });

    it('should return 500 on service error', async () => {
      tagService.getAllTags.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/tag');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/tag/:id ───────────────────────────────────────────────────────
  describe('GET /api/tag/:id', () => {
    it('should return a tag by ID', async () => {
      const mockTag = { id: 1, tagName: 'Sustainable', isActive: true };
      tagService.getTagById.mockResolvedValue(mockTag);

      const res = await request(app).get('/api/tag/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockTag);
    });

    it('should return 404 when tag not found', async () => {
      tagService.getTagById.mockResolvedValue(null);

      const res = await request(app).get('/api/tag/999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      tagService.getTagById.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/tag/1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /api/tag ──────────────────────────────────────────────────────────
  describe('POST /api/tag', () => {
    it('should create a new tag', async () => {
      const mockTag = { id: 3, tagName: 'Organic', isActive: true };
      userService.getUserIdByCognitoSub.mockResolvedValue(42);
      tagService.createTag.mockResolvedValue(mockTag);

      const res = await request(app)
        .post('/api/tag')
        .send({ tag_name: 'Organic', is_active: true });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockTag);
    });

    it('should return 400 when tag_name is missing', async () => {
      const res = await request(app)
        .post('/api/tag')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 when user not found for cognito sub', async () => {
      userService.getUserIdByCognitoSub.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/tag')
        .send({ tag_name: 'Organic' });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      userService.getUserIdByCognitoSub.mockResolvedValue(42);
      tagService.createTag.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/api/tag')
        .send({ tag_name: 'Organic' });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── PATCH /api/tag/:id ─────────────────────────────────────────────────────
  describe('PATCH /api/tag/:id', () => {
    it('should update a tag', async () => {
      const mockTag = { id: 1, tagName: 'Updated Tag', isActive: false };
      tagService.updateTag.mockResolvedValue(mockTag);

      const res = await request(app)
        .patch('/api/tag/1')
        .send({ tag_name: 'Updated Tag', is_active: false });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockTag);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app)
        .patch('/api/tag/abc')
        .send({ tag_name: 'Updated' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when no fields are provided', async () => {
      const res = await request(app)
        .patch('/api/tag/1')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      tagService.updateTag.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .patch('/api/tag/1')
        .send({ tag_name: 'Updated' });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── DELETE /api/tag/:id ────────────────────────────────────────────────────
  describe('DELETE /api/tag/:id', () => {
    it('should delete a tag', async () => {
      tagService.getItemTypeTagsById.mockResolvedValue([]);
      tagService.deleteTag.mockResolvedValue({});

      const res = await request(app).delete('/api/tag/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app).delete('/api/tag/abc');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 409 when tag is associated with item types', async () => {
      tagService.getItemTypeTagsById.mockResolvedValue([{ id: 1 }]);

      const res = await request(app).delete('/api/tag/1');
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      tagService.getItemTypeTagsById.mockResolvedValue([]);
      tagService.deleteTag.mockRejectedValue(new Error('DB error'));

      const res = await request(app).delete('/api/tag/1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/tag/:id/get-item-type-tags ────────────────────────────────────
  describe('GET /api/tag/:id/get-item-type-tags', () => {
    it('should return item type tags', async () => {
      const mockTags = [{ id: 1, tagId: 1, itemTypeId: 5 }];
      tagService.getItemTypeTagsById.mockResolvedValue(mockTags);

      const res = await request(app).get('/api/tag/1/get-item-type-tags');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockTags);
    });

    it('should return 500 on service error', async () => {
      tagService.getItemTypeTagsById.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/tag/1/get-item-type-tags');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/tag/:id/item-type/:item_type_id/get-item-type-tags ────────────
  describe('GET /api/tag/:id/item-type/:item_type_id/get-item-type-tags', () => {
    it('should return item type tags by item type ID', async () => {
      const mockTags = [{ id: 1, tagId: 1, itemTypeId: 5 }];
      tagService.getItemTypeTagsByItemTypeId.mockResolvedValue(mockTags);

      const res = await request(app).get('/api/tag/1/item-type/5/get-item-type-tags');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockTags);
    });

    it('should return 500 on service error', async () => {
      tagService.getItemTypeTagsByItemTypeId.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/tag/1/item-type/5/get-item-type-tags');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
