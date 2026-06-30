'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockRounded from '@mui/icons-material/LockRounded';
import SnackbarAlert from '@/components/SnackbarAlert';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function SetNewPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'error' });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Please fill in both password fields.',
        severity: 'error',
      });
      return;
    }

    if (password !== confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Passwords do not match.',
        severity: 'error',
      });
      return;
    }

    if (password.length < 8) {
      setSnackbar({
        open: true,
        message: 'Password must be at least 8 characters long.',
        severity: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      // User arrives here after clicking the reset link → callback exchanged code → session exists
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setSnackbar({
          open: true,
          message: error.message || 'Failed to set new password. Please try again.',
          severity: 'error',
        });
        return;
      }

      setSnackbar({
        open: true,
        message: 'Password set successfully! Redirecting...',
        severity: 'success',
      });

      router.push('/overview');
      router.refresh();
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
        Set New Password
      </Typography>

      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', textAlign: 'center', mb: 3 }}
      >
        Enter your new password below.
      </Typography>

      <TextField
        id="password"
        label="New Password"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        fullWidth
        placeholder="Minimum 8 characters"
        margin="normal"
        helperText="Must be at least 8 characters"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <LockRounded sx={{ color: 'action.active' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  edge="end"
                  size="small"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <TextField
        id="confirm-password"
        label="Confirm Password"
        type={showConfirmPassword ? 'text' : 'password'}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        fullWidth
        placeholder="Repeat your new password"
        margin="normal"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <LockRounded sx={{ color: 'action.active' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  edge="end"
                  size="small"
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading || !password || !confirmPassword}
        sx={{
          mt: 3,
          mb: 2,
          py: 1.25,
          backgroundColor: '#69aa56',
          fontWeight: 600,
          '&:hover': { backgroundColor: '#5a9a48' },
        }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Set Password'}
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
