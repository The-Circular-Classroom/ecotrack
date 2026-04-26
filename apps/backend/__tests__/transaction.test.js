const request = require('supertest');

jest.mock('../models/transactionService');
const transactionService = require('../models/transactionService');
const app = require('../app');

describe('Transaction API', () => {
  // ── POST /api/transaction ──────────────────────────────────────────────────
  describe('POST /api/transaction', () => {
    const validBody = {
      from_stored_at: 'Warehouse A',
      to_stored_at: 'Store B',
      from_status: 'Available',
      to_status: 'InUse',
      quantity: 5,
      transaction_type: 'Transfer',
      remarks: 'Test transfer',
      item_type_id: 1,
      size_option_id: 2,
      donation_drive_id: null,
      user_id: 42,
    };

    it('should create a new transaction', async () => {
      const mockTransactions = [{ id: 1, ...validBody }];
      transactionService.createTransaction.mockResolvedValue(mockTransactions);

      const res = await request(app)
        .post('/api/transaction')
        .send(validBody);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockTransactions);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/transaction')
        .send({ quantity: 5 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when quantity is invalid', async () => {
      const res = await request(app)
        .post('/api/transaction')
        .send({ ...validBody, quantity: -1 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when to_status is missing', async () => {
      const res = await request(app)
        .post('/api/transaction')
        .send({ ...validBody, to_status: null });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when from_status is missing for non-DonationIn', async () => {
      const res = await request(app)
        .post('/api/transaction')
        .send({ ...validBody, from_status: null, transaction_type: 'Transfer' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should allow missing from_status for DonationIn', async () => {
      const donationBody = {
        ...validBody,
        from_status: null,
        transaction_type: 'DonationIn',
      };
      const mockTransactions = [{ id: 2, ...donationBody }];
      transactionService.createTransaction.mockResolvedValue(mockTransactions);

      const res = await request(app)
        .post('/api/transaction')
        .send(donationBody);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 on validation error from service', async () => {
      transactionService.createTransaction.mockRejectedValue(
        new Error('Insufficient inventory balance'),
      );

      const res = await request(app)
        .post('/api/transaction')
        .send(validBody);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on unexpected service error', async () => {
      transactionService.createTransaction.mockRejectedValue(
        new Error('Connection lost'),
      );

      const res = await request(app)
        .post('/api/transaction')
        .send(validBody);
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/transaction ───────────────────────────────────────────────────
  describe('GET /api/transaction', () => {
    it('should return paginated transactions', async () => {
      const mockResult = {
        data: [{ id: 1 }],
        page: 1,
        limit: 100,
        total: 1,
      };
      transactionService.getAllTransactions.mockResolvedValue(mockResult);

      const res = await request(app).get('/api/transaction');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockResult.data);
    });

    it('should pass page and limit query params', async () => {
      transactionService.getAllTransactions.mockResolvedValue({ data: [], page: 2, limit: 10, total: 0 });

      await request(app).get('/api/transaction?page=2&limit=10');
      expect(transactionService.getAllTransactions).toHaveBeenCalledWith(2, 10);
    });

    it('should return 500 on service error', async () => {
      transactionService.getAllTransactions.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/transaction');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/transaction/:id ───────────────────────────────────────────────
  describe('GET /api/transaction/:id', () => {
    it('should return a transaction by ID', async () => {
      const mockTx = { id: 'tx-1', quantity: 5 };
      transactionService.getTransactionById.mockResolvedValue(mockTx);

      const res = await request(app).get('/api/transaction/tx-1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockTx);
    });

    it('should return 404 when transaction not found', async () => {
      transactionService.getTransactionById.mockResolvedValue(null);

      const res = await request(app).get('/api/transaction/tx-999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      transactionService.getTransactionById.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/transaction/tx-1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/transaction/date-range ────────────────────────────────────────
  describe('GET /api/transaction/date-range', () => {
    it('should return transactions within date range', async () => {
      const mockTxs = [{ id: 'tx-1' }];
      transactionService.getTransactionsByDateRange.mockResolvedValue(mockTxs);

      const res = await request(app).get(
        '/api/transaction/date-range?startDate=2025-01-01&endDate=2025-12-31',
      );
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockTxs);
    });

    it('should return 400 when dates are missing', async () => {
      const res = await request(app).get('/api/transaction/date-range');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on service error', async () => {
      transactionService.getTransactionsByDateRange.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get(
        '/api/transaction/date-range?startDate=2025-01-01&endDate=2025-12-31',
      );
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/transaction/type/:type ────────────────────────────────────────
  describe('GET /api/transaction/type/:type', () => {
    it('should return transactions by type', async () => {
      const mockTxs = [{ id: 'tx-1', transactionType: 'DonationIn' }];
      transactionService.getTransactionsByType.mockResolvedValue(mockTxs);

      const res = await request(app).get('/api/transaction/type/DonationIn');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockTxs);
    });

    it('should return 500 on service error', async () => {
      transactionService.getTransactionsByType.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/transaction/type/DonationIn');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/transaction/donation-drive/:donationDriveId ───────────────────
  describe('GET /api/transaction/donation-drive/:donationDriveId', () => {
    it('should return transactions by donation drive', async () => {
      const mockTxs = [{ id: 'tx-1', donationDriveId: 'dd-1' }];
      transactionService.getTransactionsByDonationDrive.mockResolvedValue(mockTxs);

      const res = await request(app).get('/api/transaction/donation-drive/dd-1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockTxs);
    });

    it('should return 500 on service error', async () => {
      transactionService.getTransactionsByDonationDrive.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/transaction/donation-drive/dd-1');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
