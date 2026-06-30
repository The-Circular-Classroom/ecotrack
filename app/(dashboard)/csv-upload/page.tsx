'use client';

import { useState, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import ErrorRounded from '@mui/icons-material/ErrorRounded';
import WarningAmber from '@mui/icons-material/WarningAmber';
import SnackbarAlert from '@/components/SnackbarAlert';

// Types
interface ValidationResult {
  status: 'validated' | 'failed';
  filePath: string;
  totalRows?: number;
  validRows?: number;
  invalidRows?: number;
  errors?: Array<{ row: number; field: string; message: string }>;
  error?: string;
  message?: string;
}

interface UploadResult {
  path: string;
  filename: string;
}

interface ApproveResult {
  status: string;
  transactionsCreated?: number;
  balancesUpdated?: number;
  warning?: string;
  error?: string;
  message?: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const steps = ['Select File', 'Validate', 'Upload', 'Approve'];

const ACCEPTED_FILE_TYPES = ['.csv', '.xlsx'];
const ACCEPTED_MIME_TYPES = [
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

export default function CsvUploadPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [approveResult, setApproveResult] = useState<ApproveResult | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File validation
  const isValidFileType = (file: File): boolean => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (ACCEPTED_FILE_TYPES.includes(ext)) return true;
    if (ACCEPTED_MIME_TYPES.includes(file.type)) return true;
    return false;
  };

  // Drag & drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (isValidFileType(file)) {
        setSelectedFile(file);
        setSnackbar({
          open: true,
          message: `File "${file.name}" selected`,
          severity: 'info',
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Invalid file type. Please select a .csv or .xlsx file.',
          severity: 'error',
        });
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isValidFileType(file)) {
        setSelectedFile(file);
        setSnackbar({
          open: true,
          message: `File "${file.name}" selected`,
          severity: 'info',
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Invalid file type. Please select a .csv or .xlsx file.',
          severity: 'error',
        });
      }
    }
  };

  // Step 2: Upload file to server
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/csv/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setUploadResult(data as UploadResult);
      setActiveStep(1);
      setSnackbar({
        open: true,
        message: 'File uploaded successfully. Starting validation...',
        severity: 'success',
      });

      // Auto-trigger validation
      await handleValidate(data.path);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload file';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setUploading(false);
    }
  };

  // Step 3: Validate file
  const handleValidate = async (filePath?: string) => {
    const path = filePath || uploadResult?.path;
    if (!path) return;

    setValidating(true);
    try {
      const res = await fetch('/api/csv/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: path }),
      });

      const data = await res.json();
      setValidationResult(data as ValidationResult);

      if (data.status === 'validated') {
        setActiveStep(2);
        setSnackbar({
          open: true,
          message: `Validation passed. ${data.validRows ?? 0} rows validated successfully.`,
          severity: 'success',
        });
      } else {
        setActiveStep(1);
        setSnackbar({
          open: true,
          message: data.message || 'Validation failed. Please review the errors below.',
          severity: 'error',
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Validation request failed';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setValidating(false);
    }
  };

  // Step 4: Approve
  const handleApprove = async () => {
    if (!validationResult?.filePath) return;

    setApproving(true);
    try {
      const res = await fetch('/api/csv/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: validationResult.filePath }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Approval failed');
      }

      setApproveResult(data as ApproveResult);
      setActiveStep(3);
      setSnackbar({
        open: true,
        message: `Approved! ${data.transactionsCreated ?? 0} transactions created.`,
        severity: 'success',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Approval request failed';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setApproving(false);
    }
  };

  // Reset workflow
  const handleReset = () => {
    setActiveStep(0);
    setSelectedFile(null);
    setUploadResult(null);
    setValidationResult(null);
    setApproveResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        CSV Upload
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Upload donation CSV or Excel files for bulk processing and validation.
      </Typography>

      {/* Stepper */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step 1: File Selection */}
      {activeStep === 0 && (
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Select File
          </Typography>

          {/* Drag and Drop Zone */}
          <Box
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            sx={{
              border: '2px dashed',
              borderColor: isDragging ? 'primary.main' : 'grey.400',
              borderRadius: 2,
              p: 6,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: isDragging ? 'action.hover' : 'transparent',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'action.hover',
              },
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <CloudUploadRounded
              sx={{ fontSize: 64, color: isDragging ? 'primary.main' : 'grey.500', mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Drag &amp; drop your file here
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              or click to browse files
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Accepted formats: .csv, .xlsx
            </Typography>
          </Box>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {/* Selected File Info */}
          {selectedFile && (
            <Box mt={3}>
              <Alert severity="info" icon={<CheckCircleRounded />}>
                <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
              </Alert>
              <Box mt={2} display="flex" gap={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpload}
                  disabled={uploading}
                  startIcon={
                    uploading ? <CircularProgress size={16} /> : <CloudUploadRounded />
                  }
                >
                  {uploading ? 'Uploading...' : 'Upload & Validate'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  disabled={uploading}
                >
                  Remove
                </Button>
              </Box>
            </Box>
          )}

          {/* Upload progress indicator */}
          {uploading && (
            <Box mt={2}>
              <LinearProgress color="primary" />
            </Box>
          )}
        </Paper>
      )}

      {/* Step 2: Validation Results */}
      {activeStep === 1 && (
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Validation Results
          </Typography>

          {validating && (
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <CircularProgress size={24} />
              <Typography>Validating file...</Typography>
            </Box>
          )}

          {validationResult && !validating && (
            <>
              {validationResult.status === 'validated' ? (
                <Alert severity="success" icon={<CheckCircleRounded />} sx={{ mb: 2 }}>
                  Validation passed — {validationResult.validRows ?? 0} of{' '}
                  {validationResult.totalRows ?? 0} rows are valid.
                </Alert>
              ) : (
                <Alert severity="error" icon={<ErrorRounded />} sx={{ mb: 2 }}>
                  Validation failed — {validationResult.invalidRows ?? 0} of{' '}
                  {validationResult.totalRows ?? 0} rows have errors.
                </Alert>
              )}

              {/* Validation summary */}
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Total rows: {validationResult.totalRows ?? 'N/A'}
                </Typography>
                {validationResult.validRows !== undefined && (
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Valid rows: {validationResult.validRows}
                  </Typography>
                )}
                {validationResult.invalidRows !== undefined && (
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Invalid rows: {validationResult.invalidRows}
                  </Typography>
                )}
              </Box>

              {/* Error details */}
              {validationResult.errors && validationResult.errors.length > 0 && (
                <Box mb={2}>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>
                    Errors
                  </Typography>
                  <List dense>
                    {validationResult.errors.slice(0, 20).map((err, index) => (
                      <ListItem key={index}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <ErrorRounded color="error" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`Row ${err.row}: ${err.message}`}
                          secondary={`Field: ${err.field}`}
                        />
                      </ListItem>
                    ))}
                    {validationResult.errors.length > 20 && (
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <WarningAmber color="warning" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`...and ${validationResult.errors.length - 20} more errors`}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}

              <Box display="flex" gap={2}>
                {validationResult.status === 'validated' ? (
                  <Button variant="contained" color="primary" onClick={() => setActiveStep(2)}>
                    Continue to Approval
                  </Button>
                ) : (
                  <Button variant="contained" color="primary" onClick={handleReset}>
                    Upload New File
                  </Button>
                )}
                <Button variant="outlined" onClick={handleReset}>
                  Start Over
                </Button>
              </Box>
            </>
          )}
        </Paper>
      )}

      {/* Step 3: Upload confirmed — ready for approval */}
      {activeStep === 2 && (
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Ready for Approval
          </Typography>

          <Alert severity="success" icon={<CheckCircleRounded />} sx={{ mb: 2 }}>
            File uploaded and validated successfully. Ready for admin approval to process
            transactions.
          </Alert>

          {validationResult && (
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                File: {validationResult.filePath}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Valid rows: {validationResult.validRows ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total rows: {validationResult.totalRows ?? 0}
              </Typography>
            </Box>
          )}

          {approving && (
            <Box mb={2}>
              <LinearProgress color="primary" />
              <Typography variant="body2" color="text.secondary" mt={1}>
                Processing approval...
              </Typography>
            </Box>
          )}

          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleApprove}
              disabled={approving}
              startIcon={approving ? <CircularProgress size={16} /> : <CheckCircleRounded />}
            >
              {approving ? 'Approving...' : 'Approve & Process'}
            </Button>
            <Button variant="outlined" onClick={handleReset} disabled={approving}>
              Cancel
            </Button>
          </Box>
        </Paper>
      )}

      {/* Step 4: Approval complete */}
      {activeStep === 3 && (
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Processing Complete
          </Typography>

          <Alert severity="success" icon={<CheckCircleRounded />} sx={{ mb: 2 }}>
            CSV file has been approved and processed successfully.
          </Alert>

          {approveResult && (
            <List dense>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleRounded color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={`${approveResult.transactionsCreated ?? 0} transactions created`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleRounded color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={`${approveResult.balancesUpdated ?? 0} inventory balances updated`}
                />
              </ListItem>
              {approveResult.warning && (
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <WarningAmber color="warning" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={approveResult.warning} />
                </ListItem>
              )}
            </List>
          )}

          <Box mt={2}>
            <Button variant="contained" color="primary" onClick={handleReset}>
              Upload Another File
            </Button>
          </Box>
        </Paper>
      )}

      <SnackbarAlert
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}
