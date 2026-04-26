const request = require('supertest');

jest.mock('../models/donationService');
jest.mock('../models/transactionService');
jest.mock('../models/inventoryService');
jest.mock('../models/userService');
jest.mock('../models/itemTypeService');
jest.mock('../models/schoolService');
jest.mock('../services/email/emailService');
jest.mock('../services/uploads/s3Service');

const donationService = require('../models/donationService');
const transactionService = require('../models/transactionService');
const userService = require('../models/userService');
const itemTypeService = require('../models/itemTypeService');
const schoolService = require('../models/schoolService');
const { publish_to_sns } = require('../services/email/emailService');
const app = require('../app');

describe('Donation API', () => {
  // ── GET /api/donation-drive ────────────────────────────────────────────────
  describe('GET /api/donation-drive', () => {
    it('should return all donation drives', async () => {
      const mockResult = {
        data: [{ id: 1, driveName: 'Spring Drive' }],
        page: 1,
        total: 1,
      };
      donationService.getAllDonationDrives.mockResolvedValue(mockResult);

      const res = await request(app).get('/api/donation-drive');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 500 on service error', async () => {
      donationService.getAllDonationDrives.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/donation-drive');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/donation-drive/active ─────────────────────────────────────────
  describe('GET /api/donation-drive/active', () => {
    it('should return active donation drives', async () => {
      const mockDrives = [{ id: 1, driveName: 'Active Drive' }];
      donationService.getActiveDonationDrives.mockResolvedValue(mockDrives);

      const res = await request(app).get('/api/donation-drive/active');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockDrives);
    });

    it('should return 500 on service error', async () => {
      donationService.getActiveDonationDrives.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/donation-drive/active');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/donation-drive/school/:schoolId ───────────────────────────────
  describe('GET /api/donation-drive/school/:schoolId', () => {
    it('should return donation drives for a school', async () => {
      const mockDrives = [{ id: 1, schoolId: 1 }];
      donationService.getDonationDrivesBySchool.mockResolvedValue(mockDrives);

      const res = await request(app).get('/api/donation-drive/school/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockDrives);
    });

    it('should return 400 for invalid school ID', async () => {
      const res = await request(app).get('/api/donation-drive/school/abc');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      donationService.getDonationDrivesBySchool.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/donation-drive/school/1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/donation-drive/:id ────────────────────────────────────────────
  describe('GET /api/donation-drive/:id', () => {
    it('should return a donation drive by ID', async () => {
      const mockDrive = { id: 1, driveName: 'Spring Drive' };
      donationService.getDonationDriveById.mockResolvedValue(mockDrive);

      const res = await request(app).get('/api/donation-drive/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockDrive);
    });

    it('should return 404 when donation drive not found', async () => {
      donationService.getDonationDriveById.mockResolvedValue(null);

      const res = await request(app).get('/api/donation-drive/999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app).get('/api/donation-drive/abc');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      donationService.getDonationDriveById.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/donation-drive/1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /api/donation-drive ───────────────────────────────────────────────
  describe('POST /api/donation-drive', () => {
    const validBody = {
      drive_name: 'Spring Drive',
      start_date: '2025-03-01',
      end_date: '2025-04-01',
      location: 'Main Hall',
      school_id: 1,
      created_by_user_id: 42,
    };

    it('should create a donation drive', async () => {
      const mockDrive = { id: 1, ...validBody };
      schoolService.getSchoolNameById.mockResolvedValue('Test School');
      donationService.createDonationDrive.mockResolvedValue(mockDrive);
      publish_to_sns.mockResolvedValue({});

      const res = await request(app)
        .post('/api/donation-drive')
        .send(validBody);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockDrive);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/donation-drive')
        .send({ drive_name: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid date format', async () => {
      const res = await request(app)
        .post('/api/donation-drive')
        .send({ ...validBody, start_date: 'not-a-date' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when end date is before start date', async () => {
      const res = await request(app)
        .post('/api/donation-drive')
        .send({
          ...validBody,
          start_date: '2025-04-01',
          end_date: '2025-03-01',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      schoolService.getSchoolNameById.mockResolvedValue('Test School');
      donationService.createDonationDrive.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/api/donation-drive')
        .send(validBody);
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── PATCH /api/donation-drive/:id ──────────────────────────────────────────
  describe('PATCH /api/donation-drive/:id', () => {
    it('should update a donation drive', async () => {
      const existing = {
        id: 1,
        driveName: 'Old Name',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-07-01'),
        location: 'Old Location',
        schoolId: 1,
      };
      donationService.getDonationDriveById.mockResolvedValue(existing);
      donationService.updateDonationDrive.mockResolvedValue({
        ...existing,
        driveName: 'New Name',
      });

      const res = await request(app)
        .patch('/api/donation-drive/1')
        .send({ drive_name: 'New Name' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app)
        .patch('/api/donation-drive/abc')
        .send({ drive_name: 'New' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 when drive not found', async () => {
      donationService.getDonationDriveById.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/donation-drive/999')
        .send({ drive_name: 'New' });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      const existing = {
        id: 1,
        driveName: 'Old Name',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-07-01'),
        location: 'Old Location',
        schoolId: 1,
      };
      donationService.getDonationDriveById.mockResolvedValue(existing);
      donationService.updateDonationDrive.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .patch('/api/donation-drive/1')
        .send({ drive_name: 'New Name' });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── DELETE /api/donation-drive/:id ─────────────────────────────────────────
  describe('DELETE /api/donation-drive/:id', () => {
    it('should delete a donation drive', async () => {
      donationService.getDonationDriveById.mockResolvedValue({ id: 1 });
      transactionService.getTransactionsByDonationDrive.mockResolvedValue([]);
      donationService.deleteDonationDrive.mockResolvedValue({});

      const res = await request(app).delete('/api/donation-drive/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app).delete('/api/donation-drive/abc');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 when drive not found', async () => {
      donationService.getDonationDriveById.mockResolvedValue(null);

      const res = await request(app).delete('/api/donation-drive/999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 409 when drive has linked transactions', async () => {
      donationService.getDonationDriveById.mockResolvedValue({ id: 1 });
      transactionService.getTransactionsByDonationDrive.mockResolvedValue([
        { id: 'tx-1' },
        { id: 'tx-2' },
      ]);

      const res = await request(app).delete('/api/donation-drive/1');
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      donationService.getDonationDriveById.mockResolvedValue({ id: 1 });
      transactionService.getTransactionsByDonationDrive.mockResolvedValue([]);
      donationService.deleteDonationDrive.mockRejectedValue(new Error('DB error'));

      const res = await request(app).delete('/api/donation-drive/1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /api/donation-drive/donate ────────────────────────────────────────
  describe('POST /api/donation-drive/donate', () => {
    const validDonation = {
      from_stored_at: null,
      to_stored_at: 'school',
      from_status: null,
      to_status: 'ForSale',
      quantity: 5,
      transaction_type: 'DonationIn',
      remarks: 'Test donation',
      item_type_id: 1,
      donation_drive_id: 1,
      size_name: 'M',
    };

    it('should create a donation', async () => {
      const mockItemType = {
        id: 1,
        sizeCategory: {
          sizeOptions: [{ id: 10, sizeName: 'M' }],
        },
      };
      userService.ensureUserFromToken.mockResolvedValue({ id: 42 });
      itemTypeService.getItemTypeById.mockResolvedValue(mockItemType);
      donationService.getDonationDriveById.mockResolvedValue({ id: 1 });
      transactionService.createTransaction.mockResolvedValue([{ id: 1 }]);

      const res = await request(app)
        .post('/api/donation-drive/donate')
        .send(validDonation);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 when item type not found', async () => {
      userService.ensureUserFromToken.mockResolvedValue({ id: 42 });
      itemTypeService.getItemTypeById.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/donation-drive/donate')
        .send(validDonation);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 when size option not found', async () => {
      const mockItemType = {
        id: 1,
        sizeCategory: {
          sizeOptions: [{ id: 10, sizeName: 'L' }], // 'M' not found
        },
      };
      userService.ensureUserFromToken.mockResolvedValue({ id: 42 });
      itemTypeService.getItemTypeById.mockResolvedValue(mockItemType);

      const res = await request(app)
        .post('/api/donation-drive/donate')
        .send(validDonation);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      userService.ensureUserFromToken.mockResolvedValue({ id: 42 });
      itemTypeService.getItemTypeById.mockResolvedValue({
        id: 1,
        sizeCategory: { sizeOptions: [{ id: 10, sizeName: 'M' }] },
      });
      donationService.getDonationDriveById.mockResolvedValue({ id: 1 });
      transactionService.createTransaction.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/api/donation-drive/donate')
        .send(validDonation);
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
