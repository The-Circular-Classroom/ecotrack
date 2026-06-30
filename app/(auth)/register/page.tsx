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
import PhoneRounded from '@mui/icons-material/PhoneRounded';
import SnackbarAlert from '@/components/SnackbarAlert';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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

    if (!fullName.trim() || !firstName.trim() || !lastName.trim() || !email.trim()) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields.',
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: phoneNumber.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSnackbar({
          open: true,
          message: data.message || data.error || 'Registration failed. Please try again.',
          severity: 'error',
        });
        return;
      }

      // On success, show message to check email for confirmation link
      setSnackbar({
        open: true,
        message: 'Check your email to confirm your account.',
        severity: 'success',
      });
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
        id="fullName"
        label="Full Name"
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
        fullWidth
        placeholder="John Doe"
        margin="normal"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <PersonOutline sx={{ color: 'action.active' }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          id="firstName"
          label="First Name"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          fullWidth
          placeholder="John"
          margin="normal"
        />

        <TextField
          id="lastName"
          label="Last Name"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          fullWidth
          placeholder="Doe"
          margin="normal"
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
        id="phoneNumber"
        label="Phone"
        type="tel"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        fullWidth
        placeholder="+1 (555) 123-4567"
        margin="normal"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <PhoneRounded sx={{ color: 'action.active' }} />
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
