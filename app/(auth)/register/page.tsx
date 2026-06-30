'use client';

import { useState, FormEvent } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import EmailRounded from '@mui/icons-material/EmailRounded';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonOutline from '@mui/icons-material/PersonOutline';
import SnackbarAlert from '@/components/SnackbarAlert';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'error' });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      setSnackbar({
        open: true,
        message: 'Password must be at least 8 characters long.',
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

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (signUpError) {
        setSnackbar({ open: true, message: signUpError.message, severity: 'error' });
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
          We&apos;ve sent a confirmation link to <strong>{email}</strong>. Please check your
          inbox and click the link to activate your account.
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
        Create Account
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Chip
          icon={<PersonOutline />}
          label="You'll be assigned the Parent role by default"
          variant="outlined"
          size="small"
          sx={{ color: 'text.secondary' }}
        />
      </Box>

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

      <TextField
        id="password"
        label="Password"
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
        id="confirmPassword"
        label="Confirm Password"
        type={showConfirmPassword ? 'text' : 'password'}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        fullWidth
        placeholder="Repeat your password"
        margin="normal"
        slotProps={{
          input: {
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
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
      </Button>

      <Box sx={{ textAlign: 'center', mt: 1.5 }}>
        <Typography variant="body2" color="text.secondary" component="span">
          Already have an account?{' '}
        </Typography>
        <Link href="/login" underline="hover" variant="body2">
          Sign in
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
