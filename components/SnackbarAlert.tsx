'use client'

import React from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

interface SnackbarAlertProps {
  open: boolean
  autoHideDuration?: number
  onClose: (event?: React.SyntheticEvent | Event, reason?: string) => void
  message: string
  severity: 'success' | 'info' | 'warning' | 'error'
  icon?: React.ReactNode | boolean
}

export default function SnackbarAlert({
  open,
  autoHideDuration = 2500,
  onClose,
  message,
  severity,
  icon = false,
}: SnackbarAlertProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{ width: '100%' }}
        icon={icon}
      >
        {message}
      </Alert>
    </Snackbar>
  )
}
