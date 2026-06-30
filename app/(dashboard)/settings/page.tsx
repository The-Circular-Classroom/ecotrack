'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import SnackbarAlert from '@/components/SnackbarAlert';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    async function fetchUser() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          setSnackbar({ open: true, message: 'Failed to load user info', severity: 'error' });
          return;
        }
        setEmail(user.email || '');
        setRole(user.app_metadata?.role || 'Unknown');
      } catch {
        setSnackbar({ open: true, message: 'Failed to load user info', severity: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordError(error.message);
        setSnackbar({ open: true, message: error.message, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Password updated successfully', severity: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPasswordError('An unexpected error occurred');
      setSnackbar({ open: true, message: 'An unexpected error occurred', severity: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box p={3} maxWidth={720} mx="auto">
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Manage your profile and account settings.
      </Typography>

      {/* Profile Section */}
      <Paper
        elevation={0}
        sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <PersonRounded />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your account information. Contact an admin to update your profile.
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Email"
            value={email}
            fullWidth
            InputProps={{ readOnly: true }}
            variant="outlined"
            size="small"
          />
          <TextField
            label="Role"
            value={role}
            fullWidth
            InputProps={{ readOnly: true }}
            variant="outlined"
            size="small"
          />
        </Box>
      </Paper>

      {/* Password Change Section */}
      <Paper
        elevation={0}
        sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <LockRounded />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Change Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update your password to keep your account secure.
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {passwordError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {passwordError}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handlePasswordChange}
          display="flex"
          flexDirection="column"
          gap={2}
        >
          <TextField
            label="Current Password"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    edge="end"
                    size="small"
                    aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                  >
                    {showCurrentPassword ? <VisibilityOffRounded /> : <VisibilityRounded />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="New Password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
            helperText="Minimum 8 characters"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                    size="small"
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  >
                    {showNewPassword ? <VisibilityOffRounded /> : <VisibilityRounded />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Confirm New Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    size="small"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <VisibilityOffRounded /> : <VisibilityRounded />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={passwordLoading || !newPassword || !confirmPassword}
            sx={{ alignSelf: 'flex-start', mt: 1 }}
          >
            {passwordLoading ? <CircularProgress size={20} color="inherit" /> : 'Update Password'}
          </Button>
        </Box>
      </Paper>

      <SnackbarAlert
        open={snackbar.open}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}
