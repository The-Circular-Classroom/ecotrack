// apps/backend/controllers/transactionController.js
const transactionService = require('../models/transactionService');

const addTransaction = async (req, res) => {
  try {
    const {
      from_stored_at,
      to_stored_at,
      from_status,
      to_status,
      quantity,
      transaction_type,
      remarks,
      item_type_id,
      size_option_id,
      donation_drive_id,
      user_id,
    } = req.body;

    // ── Input validation ──
    // transaction_type is optional — service can infer it from status/location changes
    if (item_type_id == null || size_option_id == null || user_id == null) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field(s): item_type_id, size_option_id, and user_id are required',
      });
    }

    if (quantity == null || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'quantity must be a positive integer',
      });
    }

    if (!to_status || typeof to_status !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'to_status is required',
      });
    }

    // DonationIn doesn't require from_status/from_stored_at
    // If transaction_type is null/undefined, service will infer — but we still need from_status for inference
    if (transaction_type !== 'DonationIn') {
      if (!from_status || typeof from_status !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'from_status is required for non-DonationIn transactions',
        });
      }
    }

    // createTransaction now always returns an array
    const transactions = await transactionService.createTransaction({
      from_stored_at,
      to_stored_at,
      from_status,
      to_status,
      quantity,
      transaction_type,
      remarks,
      item_type_id,
      size_option_id,
      donation_drive_id,
      user_id,
    });

    return res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transactions,
    });
  } catch (error) {
    console.error('Error creating transaction:', error);

    const isValidationError =
      error.message.includes('Insufficient inventory') ||
      error.message.includes('No inventory balance found') ||
      error.message.includes('Invalid status transition') ||
      error.message.includes('Cannot transition from terminal status') ||
      error.message.includes('No status or location change') ||
      error.message.includes('Invalid from_status') ||
      error.message.includes('Invalid to_status') ||
      error.message.includes('Invalid transaction type');

    return res.status(isValidationError ? 400 : 500).json({
      success: false,
      message: isValidationError ? error.message : 'Error creating transaction',
      error: error.message,
    });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;

    const result = await transactionService.getAllTransactions(page, limit);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message,
    });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await transactionService.getTransactionById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching transaction',
      error: error.message,
    });
  }
};

const getTransactionsByDonationDrive = async (req, res) => {
  try {
    const { donationDriveId } = req.params;
    const transactions = await transactionService.getTransactionsByDonationDrive(donationDriveId);

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions by donation drive:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message,
    });
  }
};

const getTransactionsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const transactions = await transactionService.getTransactionsByType(type);

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions by type:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message,
    });
  }
};

const getTransactionsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const transactions = await transactionService.getTransactionsByDateRange(startDate, endDate);

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions by date range:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message,
    });
  }
};

module.exports = {
  addTransaction,
  getAllTransactions,
  getTransactionById,
  getTransactionsByDonationDrive,
  getTransactionsByType,
  getTransactionsByDateRange,
};