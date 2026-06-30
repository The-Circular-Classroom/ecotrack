'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import EmailRounded from '@mui/icons-material/EmailRounded';
import SnackbarAlert from '@/components/SnackbarAlert';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'error' });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter your email address.',
        severity: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSnackbar({
          open: true,
          message: data.error || 'Failed to send verification code. Please try again.',
          severity: 'error',
        });
        return;
      }

      setSnackbar({
        open: true,
        message: 'Verification code sent! Redirecting...',
        severity: 'success',
      });

      // Redirect to reset-password page with username
      const params = new URLSearchParams({ username: email.trim() });
      router.push(`/reset-password?${params.toString()}`);
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

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography
        variant="h6"
        component="h2"
        sx={{ fontWeight: 600, textAlign: 'center', mb: 1 }}
      >
        Forgot Password
      </Typography>

      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', textAlign: 'center', mb: 3 }}
      >
        Enter your email address and we&apos;ll send you a verification code to reset your
        password.
      </Typography>

      <TextField
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
        placeholder="you@example.com"
        margin="normal"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <EmailRounded sx={{ color: 'action.active' }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading || !email.trim()}
        sx={{
          mt: 3,
          mb: 2,
          py: 1.25,
          backgroundColor: '#69aa56',
          fontWeight: 600,
          '&:hover': { backgroundColor: '#5a9a48' },
        }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Verification Code'}
      </Button>

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
