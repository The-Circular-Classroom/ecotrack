'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import EmailRounded from '@mui/icons-material/EmailRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import SnackbarAlert from '@/components/SnackbarAlert';
import StyledConfirmDialog from '@/components/StyledConfirmDialog';

interface UserProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  roles: string;
  username: string;
  phone: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Name section state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fullName, setFullName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);

  // Email section state
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Password section state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Deactivate section state
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Fetch user profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          showSnackbar('Failed to load profile', 'error');
          return;
        }
        const data: UserProfile = await res.json();
        setProfile(data);
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setFullName(data.fullName || '');
        setNewEmail(data.email || '');
      } catch {
        showSnackbar('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // Handle name update
  const handleNameSave = async () => {
    setNameLoading(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, fullName }),
      });
      const data = await res.json();
      if (!res.ok) {
        showSnackbar(data.message || 'Failed to update name', 'error');
        return;
      }
      showSnackbar('Name updated successfully', 'success');
      setProfile((prev) => prev ? { ...prev, firstName, lastName, fullName } : prev);
    } catch {
      showSnackbar('Failed to update name', 'error');
    } finally {
      setNameLoading(false);
    }
  };

  // Handle email change
  const handleEmailChange = async () => {
    if (!newEmail || newEmail === profile?.email) {
      showSnackbar('Please enter a new email address', 'warning');
      return;
    }
    setEmailLoading(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        showSnackbar(data.message || 'Failed to update email', 'error');
        return;
      }
      if (data.requiresVerification) {
        setShowVerificationInput(true);
        showSnackbar('Verification code sent to new email', 'info');
      } else {
        showSnackbar('Email updated successfully', 'success');
        setProfile((prev) => prev ? { ...prev, email: newEmail } : prev);
      }
    } catch {
      showSnackbar('Failed to update email', 'error');
    } finally {
      setEmailLoading(false);
    }
  };

  // Handle email verification
  const handleEmailVerification = async () => {
    if (!emailVerificationCode) {
      showSnackbar('Please enter the verification code', 'warning');
      return;
    }
    setVerifyLoading(true);
    try {
      const res = await fetch('/api/auth/verify-user-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: emailVerificationCode, type: 'email_change' }),
      });
      const data = await res.json();
      if (!res.ok) {
        showSnackbar(data.message || 'Verification failed', 'error');
        return;
      }
      showSnackbar('Email updated successfully', 'success');
      setProfile((prev) => prev ? { ...prev, email: newEmail } : prev);
      setShowVerificationInput(false);
      setEmailVerificationCode('');
    } catch {
      showSnackbar('Verification failed', 'error');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (newPassword.length < 8) {
      showSnackbar('New password must be at least 8 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showSnackbar('New password and confirmation do not match', 'error');
      return;
    }
    if (!currentPassword) {
      showSnackbar('Please enter your current password', 'error');
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        showSnackbar(data.message || 'Failed to update password', 'error');
        return;
      }
      showSnackbar('Password updated successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      showSnackbar('Failed to update password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle account deactivation
  const handleDeactivateAccount = async () => {
    setDeactivateLoading(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        showSnackbar(data.message || 'Failed to deactivate account', 'error');
        setDeactivateDialogOpen(false);
        return;
      }
      showSnackbar('Account deactivated successfully', 'success');
      setDeactivateDialogOpen(false);
      // Redirect to login after deactivation
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch {
      showSnackbar('Failed to deactivate account', 'error');
    } finally {
      setDeactivateLoading(false);
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

      {/* Name Section */}
      <Accordion defaultExpanded sx={{ mb: 2 }}>
        <AccordionSummary
          expandIcon={<ExpandMoreRounded />}
          aria-controls="name-content"
          id="name-header"
        >
          <Box display="flex" alignItems="center" gap={1}>
            <PersonRounded color="primary" />
            <Typography fontWeight={600}>Name</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Enter your first name"
            />
            <TextField
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Enter your last name"
            />
            <TextField
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Enter your full name"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleNameSave}
              disabled={nameLoading}
              sx={{ alignSelf: 'flex-start', mt: 1 }}
            >
              {nameLoading ? <CircularProgress size={20} color="inherit" /> : 'Save Name'}
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Email Section */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary
          expandIcon={<ExpandMoreRounded />}
          aria-controls="email-content"
          id="email-header"
        >
          <Box display="flex" alignItems="center" gap={1}>
            <EmailRounded color="primary" />
            <Typography fontWeight={600}>Email</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="body2" color="text.secondary">
              Current email: {profile?.email || '—'}
            </Typography>
            <TextField
              label="New Email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Enter new email address"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleEmailChange}
              disabled={emailLoading || newEmail === profile?.email}
              sx={{ alignSelf: 'flex-start' }}
            >
              {emailLoading ? <CircularProgress size={20} color="inherit" /> : 'Change Email'}
            </Button>
            {showVerificationInput && (
              <>
                <TextField
                  label="Verification Code"
                  value={emailVerificationCode}
                  onChange={(e) => setEmailVerificationCode(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Enter the code sent to your new email"
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleEmailVerification}
                  disabled={verifyLoading || !emailVerificationCode}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  {verifyLoading ? <CircularProgress size={20} color="inherit" /> : 'Verify Code'}
                </Button>
              </>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Password Section */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary
          expandIcon={<ExpandMoreRounded />}
          aria-controls="password-content"
          id="password-header"
        >
          <Box display="flex" alignItems="center" gap={1}>
            <LockRounded color="primary" />
            <Typography fontWeight={600}>Password</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" flexDirection="column" gap={2}>
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
              variant="contained"
              color="primary"
              onClick={handlePasswordChange}
              disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
              sx={{ alignSelf: 'flex-start', mt: 1 }}
            >
              {passwordLoading ? <CircularProgress size={20} color="inherit" /> : 'Update Password'}
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Deactivate Account Section */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary
          expandIcon={<ExpandMoreRounded />}
          aria-controls="deactivate-content"
          id="deactivate-header"
        >
          <Box display="flex" alignItems="center" gap={1}>
            <DeleteRounded color="error" />
            <Typography fontWeight={600} color="error.main">
              Deactivate Account
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="body2" color="text.secondary">
              Once you deactivate your account, you will lose access to all data and services
              associated with it. This action cannot be easily undone.
            </Typography>
            <Button
              variant="contained"
              color="error"
              onClick={() => setDeactivateDialogOpen(true)}
              sx={{ alignSelf: 'flex-start' }}
            >
              Deactivate My Account
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Deactivate Confirmation Dialog */}
      <StyledConfirmDialog
        open={deactivateDialogOpen}
        onClose={() => setDeactivateDialogOpen(false)}
        onConfirm={handleDeactivateAccount}
        title="Deactivate Account"
        message="Are you sure you want to deactivate your account? This will sign you out and you will lose access to your data."
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        confirmColor="error"
        loading={deactivateLoading}
      />

      <SnackbarAlert
        open={snackbar.open}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}
