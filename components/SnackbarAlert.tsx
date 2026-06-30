'use client';

import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export interface SnackbarAlertProps {
  open: boolean;
  onClose: () => void;
  message: string;
  severity?: 'success' | 'error' | 'warning' | 'info';
}

export default function SnackbarAlert({
  open,
  onClose,
  message,
  severity = 'info',
}: SnackbarAlertProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
