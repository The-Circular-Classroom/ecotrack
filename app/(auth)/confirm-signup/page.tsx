'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import SnackbarAlert from '@/components/SnackbarAlert';

export default function ConfirmSignupPage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}>
      <ConfirmSignupContent />
    </Suspense>
  );
}

function ConfirmSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const username = searchParams.get('username') ?? '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'error' });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (code.length !== 6) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid 6-digit verification code.',
        severity: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/confirm-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSnackbar({
          open: true,
          message: data.error || 'Verification failed. Please try again.',
          severity: 'error',
        });
        return;
      }

      setSnackbar({
        open: true,
        message: 'Email verified successfully! Redirecting to login...',
        severity: 'success',
      });

      setTimeout(() => {
        const params = new URLSearchParams({ message: 'Email verified successfully. Please sign in.' });
        router.push(`/login?${params.toString()}`);
      }, 1500);
    } catch {
      setSnackbar({
        open: true,
        message: 'An unexpected error occurred. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (!username) {
      setSnackbar({
        open: true,
        message: 'Username is missing. Please register again.',
        severity: 'error',
      });
      return;
    }

    setResending(true);

    try {
      const res = await fetch('/api/auth/confirm-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, code: '', resend: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSnackbar({
          open: true,
          message: data.error || 'Failed to resend code. Please try again.',
          severity: 'error',
        });
        return;
      }

      setSnackbar({
        open: true,
        message: 'Verification code resent! Check your email.',
        severity: 'success',
      });
    } catch {
      setSnackbar({
        open: true,
        message: 'An unexpected error occurred. Please try again.',
        severity: 'error',
      });
    } finally {
      setResending(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography
        variant="h6"
        component="h2"
        sx={{ fontWeight: 600, textAlign: 'center', mb: 1 }}
      >
        Confirm Your Email
      </Typography>

      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', textAlign: 'center', mb: 3 }}
      >
        We sent a verification code to{' '}
        <strong>{username || 'your email'}</strong>. Enter it below to
        complete registration.
      </Typography>

      <TextField
        id="verification-code"
        label="Verification Code"
        type="text"
        value={code}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
          setCode(value);
        }}
        required
        fullWidth
        placeholder="000000"
        margin="normal"
        inputProps={{
          maxLength: 6,
          inputMode: 'numeric',
          pattern: '[0-9]*',
          autoComplete: 'one-time-code',
          style: { textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.25rem' },
        }}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading || code.length !== 6}
        sx={{
          mt: 3,
          mb: 2,
          py: 1.25,
          backgroundColor: '#69aa56',
          fontWeight: 600,
          '&:hover': { backgroundColor: '#5a9a48' },
        }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify Email'}
      </Button>

      <Box sx={{ textAlign: 'center', mt: 1.5 }}>
        <Button
          variant="text"
          size="small"
          onClick={handleResendCode}
          disabled={resending}
          sx={{ textTransform: 'none', color: '#69aa56' }}
        >
          {resending ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
          Resend Code
        </Button>
      </Box>

      <Box sx={{ textAlign: 'center', mt: 1.5 }}>
        <Link href="/login" underline="hover" variant="body2">
          Back to Sign In
        </Link>
      </Box>

      <SnackbarAlert
        open={snackbar.open}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}
