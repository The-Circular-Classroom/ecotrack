'use client';

import { useState, FormEvent } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import EmailRounded from '@mui/icons-material/EmailRounded';
import SnackbarAlert from '@/components/SnackbarAlert';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'error' });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/settings`,
      });

      if (resetError) {
        setSnackbar({ open: true, message: resetError.message, severity: 'error' });
        return;
      }

      setSuccess(true);
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

  if (success) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
          Check Your Email
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset
          link. Please check your inbox.
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Link href="/login" underline="hover" variant="body2">
            Back to Sign In
          </Link>
        </Box>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography
        variant="h6"
        component="h2"
        sx={{ fontWeight: 600, textAlign: 'center', mb: 1 }}
      >
        Reset Password
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ textAlign: 'center', mb: 3 }}
      >
        Enter your email address and we&apos;ll send you a link to reset your password.
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
        disabled={loading}
        sx={{
          mt: 3,
          mb: 2,
          py: 1.25,
          backgroundColor: '#69aa56',
          fontWeight: 600,
          '&:hover': { backgroundColor: '#5a9a48' },
        }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
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
