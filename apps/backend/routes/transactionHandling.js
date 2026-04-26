// apps/backend/routes/transactionHandling.js
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const {
  verifyAccessTokenAndAssertParentSupportGroupAndAbove,
} = require('../middlewares/cognitoJwt');

// POST /api/transaction
router.post('/', verifyAccessTokenAndAssertParentSupportGroupAndAbove, transactionController.addTransaction);

// GET /api/transaction
router.get('/', verifyAccessTokenAndAssertParentSupportGroupAndAbove, transactionController.getAllTransactions);

// GET /api/transaction/date-range?startDate=...&endDate=...
router.get('/date-range', verifyAccessTokenAndAssertParentSupportGroupAndAbove, transactionController.getTransactionsByDateRange);

// GET /api/transaction/type/:type
router.get('/type/:type', verifyAccessTokenAndAssertParentSupportGroupAndAbove, transactionController.getTransactionsByType);

// GET /api/transaction/donation-drive/:donationDriveId
router.get('/donation-drive/:donationDriveId', verifyAccessTokenAndAssertParentSupportGroupAndAbove, transactionController.getTransactionsByDonationDrive);

// GET /api/transaction/:id
router.get('/:id', verifyAccessTokenAndAssertParentSupportGroupAndAbove, transactionController.getTransactionById);

// NOTE: there are no PUT and DELETE apis — transactions are immutable (ledger pattern).
// To correct a mistake, create a new corrective transaction that reverses the original.

module.exports = router;
