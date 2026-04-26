'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Stack,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Typography,
  Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowForward, LockRounded, EmailRounded } from '@mui/icons-material';
import SnackbarAlert from '@/components/SnackbarAlert';
import {
  getCognitoGroupsFromAccessToken,
  getDefaultRouteForRole,
  getRoleFromSession,
  getUserRoleFromGroups,
  setRoleInSession,
} from '@/utils/auth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL;
  const router = useRouter();

  // Redirect already-authenticated users away from the login page
  useEffect(() => {
    const accessToken = sessionStorage.getItem('accessToken');
    const refreshToken = sessionStorage.getItem('refreshToken');
    if (accessToken && refreshToken) {
      const role = getRoleFromSession();
      router.replace(getDefaultRouteForRole(role));
    }
  }, [router]);

  const [open, SetOpen] = useState(false);
  const [message, SetMessage] = useState('Invalid email or password');
  const [severity, SetSeverity] = useState('error');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      SetMessage('Please provide both email address and password');
      SetSeverity('warning');
      SetOpen(true);
      return;
    }

    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (data.success) {
      sessionStorage.clear();
      sessionStorage.setItem('accessToken', data.tokens.accessToken);
      sessionStorage.setItem('refreshToken', data.tokens.refreshToken);
      sessionStorage.setItem('idToken', data.tokens.idToken);
      sessionStorage.setItem('expiresIn', data.tokens.expiresIn);

      const groups = getCognitoGroupsFromAccessToken(data.tokens.accessToken);
      const role = getUserRoleFromGroups(groups);
      setRoleInSession(role);

      SetMessage('Login successful');
      SetSeverity('success');
      SetOpen(true);

      setTimeout(() => {
        router.push(getDefaultRouteForRole(role));
      }, 800);
      return;
    }

    if (data.requiresNewPassword) {
      sessionStorage.clear();
      sessionStorage.setItem('session', data.session);
      SetMessage('Please set a new password');
      SetSeverity('warning');
      SetOpen(true);
      setTimeout(() => router.push('/auth/set-new-password'), 800);
      return;
    }

    if (data.message) {
      SetMessage(data.message);
      SetSeverity('warning');
      SetOpen(true);
      return;
    }

    SetMessage('Something went wrong, please try again');
    SetSeverity('error');
    SetOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    SetOpen(false);
  };

  return (
    <>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          px: 2,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 460 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'grey.200',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
            }}
          >
            {/* Top accent */}
            <Box
              sx={{
                height: 6,
                background:
                  'linear-gradient(90deg, var(--color-main, #16a34a) 0%, rgba(59,130,246,0.9) 60%, rgba(236,72,153,0.9) 100%)',
              }}
            />

            <Box sx={{ p: { xs: 3, sm: 4 } }}>
              <Stack spacing={1} sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" fontWeight={600} color="text.primary">
                  Welcome Back
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sign in to continue to your account.
                </Typography>
              </Stack>

              <Box component="form" onSubmit={handleLogin}>
                <Stack spacing={2.25}>
                  <TextField
                    id="username"
                    fullWidth
                    label="Email"
                    variant="outlined"
                    type="email"
                    placeholder="someone@example.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="email"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailRounded fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                        bgcolor: 'white',
                      },
                    }}
                  />

                  <TextField
                    id="password"
                    fullWidth
                    label="Password"
                    variant="outlined"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockRounded fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword((v) => !v)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                        bgcolor: 'white',
                      },
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    endIcon={<ArrowForward />}
                    sx={{
                      py: 1.35,
                      borderRadius: 2.5,
                      fontWeight: 800,
                      textTransform: 'none',
                      bgcolor: 'var(--color-main, #16a34a)',
                      '&:hover': { opacity: 0.92, bgcolor: 'var(--color-main, #16a34a)' },
                    }}
                  >
                    Sign in
                  </Button>

                  <Divider sx={{ my: 0.5 }} />

                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Need an account?{' '}
                    <Link href="/auth/signup" style={{ color: '#2563eb', fontWeight: 700 }}>
                      Sign up
                    </Link>
                  </Typography>
                </Stack>
              </Box>
            </Box>
          </Paper>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
            © {new Date().getFullYear()} The Circular Classroom
          </Typography>
        </Box>
      </Box>

      <SnackbarAlert open={open} onClose={handleClose} message={message} severity={severity} />
    </>
  );
}
