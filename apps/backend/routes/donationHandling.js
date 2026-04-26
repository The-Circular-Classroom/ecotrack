const express = require('express');
const multer = require('multer');
const router = express.Router();
const donationController = require('../controllers/donationController');
const {
  verifyAccessTokenAndAssertParentSupportGroupAndAbove,
  verifyAccessTokenAndAssertSchoolStaffAndAbove,
  verifyAccessTokenAndAssertTCCAdministratorRole
} = require('../middlewares/cognitoJwt');

// Configure multer for CSV and Excel upload (memory storage)
const storage = multer.memoryStorage();

const csvUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    const dotIndex = file.originalname.lastIndexOf('.');
    if (dotIndex === -1) {
      return cb(new Error('File must have a valid extension (.csv, .xls, or .xlsx)'));
    }

    const fileExt = file.originalname.slice(dotIndex).toLowerCase();

    const allowedFiles = {
      '.csv': ['text/csv', 'application/vnd.ms-excel'],
      '.xls': ['application/vnd.ms-excel'],
      '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    };

    if (!allowedFiles[fileExt]) {
      return cb(new Error('Only CSV and Excel files (.csv, .xls, .xlsx) are allowed'));
    }

    if (allowedFiles[fileExt].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Extension is ${fileExt} but mimetype is ${file.mimetype}`));
    }
  },
});

// Fixed routes first
router.get('/active', verifyAccessTokenAndAssertParentSupportGroupAndAbove, donationController.getActiveDonationDrives);
router.get('/school/:schoolId', verifyAccessTokenAndAssertParentSupportGroupAndAbove, donationController.getDonationDrivesBySchool);

// GET /api/donation-drive/validated-files - List all S3 objects under donations/validated
router.get('/validated-files', verifyAccessTokenAndAssertTCCAdministratorRole, donationController.getValidatedDonationFiles);
// GET /api/donation-drive/validated-files/content?key=... - Get parsed CSV/Excel content
router.get('/validated-files/content', verifyAccessTokenAndAssertTCCAdministratorRole, donationController.getValidatedFileContent);
// POST /api/donation-drive/approve-file - Move a file from pre-processing (pending) to validated (approved). Body: { key: string }
router.post('/approve-file', verifyAccessTokenAndAssertTCCAdministratorRole, donationController.approveDonationFile);
// POST /api/donation-drive/deny-file - Move a file from pre-processing (pending) to failed. Body: { key: string }
router.post('/deny-file', verifyAccessTokenAndAssertTCCAdministratorRole, donationController.denyDonationFile);

router.post('/donate', verifyAccessTokenAndAssertParentSupportGroupAndAbove, donationController.createDonationDetails);
router.post('/upload-csv', verifyAccessTokenAndAssertParentSupportGroupAndAbove, csvUpload.single('file'), donationController.uploadDonationCSV);

// Collection routes
router.get('/', verifyAccessTokenAndAssertParentSupportGroupAndAbove, donationController.getAllDonationDrives);
router.post('/', verifyAccessTokenAndAssertParentSupportGroupAndAbove, donationController.createDonationDrive);

// Item routes
router.get('/:id/csv-template', verifyAccessTokenAndAssertParentSupportGroupAndAbove, donationController.generateDonationCSVTemplate);
router.get('/:id', verifyAccessTokenAndAssertParentSupportGroupAndAbove, donationController.getDonationDriveById);
router.patch('/:id', verifyAccessTokenAndAssertSchoolStaffAndAbove, donationController.updateDonationDrive);
router.delete('/:id', verifyAccessTokenAndAssertParentSupportGroupAndAbove, donationController.deleteDonationDrive);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB.',
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  next();
});

module.exports = router;