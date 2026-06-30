'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import SnackbarAlert from '@/components/SnackbarAlert';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

/** Interval between session checks (5 minutes) */
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

/** Threshold before expiry to trigger refresh (10 minutes) */
const REFRESH_THRESHOLD_MS = 10 * 60 * 1000;

/** Threshold before expiry to show warning dialog (5 minutes) */
const WARNING_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * SessionTracker monitors the Supabase session and automatically
 * refreshes the token when it nears expiration. Displays a warning
 * dialog when the session is about to expire and redirects to login
 * if the session cannot be refreshed.
 */
export default function SessionTracker() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useRef(createSupabaseBrowserClient());

  const [openPrompt, setOpenPrompt] = useState(false);
  const [extending, setExtending] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  // Prevent multiple dialogs if already opened
  const promptRef = useRef(false);

  const handleSessionExpired = useCallback(() => {
    setOpenPrompt(false);
    promptRef.current = false;
    setAlertMessage('Your session has expired. Please log in again.');
    setAlertSeverity('warning');
    setAlertOpen(true);

    setTimeout(() => {
      router.replace('/login');
    }, 1500);
  }, [router]);

  const handleLogout = useCallback(() => {
    setOpenPrompt(false);
    promptRef.current = false;
    router.replace('/login');
  }, [router]);

  const handleExtendSession = async () => {
    try {
      setExtending(true);

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        setOpenPrompt(false);
        promptRef.current = false;
        setAlertMessage('Session successfully extended');
        setAlertSeverity('success');
        setAlertOpen(true);
      } else {
        setAlertMessage('Failed to extend session');
        setAlertSeverity('error');
        setAlertOpen(true);
        setTimeout(() => handleSessionExpired(), 1500);
      }
    } catch {
      setAlertMessage('Something went wrong while extending session');
      setAlertSeverity('error');
      setAlertOpen(true);
      setTimeout(() => handleSessionExpired(), 1500);
    } finally {
      setExtending(false);
    }
  };

  useEffect(() => {
    // Don't track session on auth pages
    if (pathname?.startsWith('/login') || pathname?.startsWith('/register') ||
        pathname?.startsWith('/reset-password') || pathname?.startsWith('/forgot-password') ||
        pathname?.startsWith('/mfa') || pathname?.startsWith('/confirm-signup') ||
        pathname?.startsWith('/set-new-password')) {
      return;
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.current.auth.getSession();

        if (!session) {
          // No active session
          handleSessionExpired();
          return;
        }

        const expiresAt = session.expires_at;
        if (!expiresAt) return;

        const now = Math.floor(Date.now() / 1000);
        const timeRemainingMs = (expiresAt - now) * 1000;

        if (timeRemainingMs <= 0) {
          // Session has expired
          handleSessionExpired();
        } else if (timeRemainingMs <= WARNING_THRESHOLD_MS && !promptRef.current) {
          // Less than 5 minutes remaining — show warning
          setOpenPrompt(true);
          promptRef.current = true;
        } else if (timeRemainingMs <= REFRESH_THRESHOLD_MS && timeRemainingMs > WARNING_THRESHOLD_MS) {
          // Between 5-10 minutes remaining — silently refresh
          await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
        } else if (timeRemainingMs > REFRESH_THRESHOLD_MS && promptRef.current) {
          // Session was extended elsewhere
          setOpenPrompt(false);
          promptRef.current = false;
        }
      } catch {
        // Silently ignore check errors — will retry on next interval
      }
    };

    // Run initial check
    checkSession();

    // Set up periodic check
    const intervalId = setInterval(checkSession, CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [pathname, handleSessionExpired]);

  return (
    <>
      <Dialog
        open={openPrompt}
        onClose={(_e, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
        }}
        aria-labelledby="session-timeout-title"
        aria-describedby="session-timeout-description"
        PaperProps={{
          sx: { borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle id="session-timeout-title" sx={{ fontWeight: 600 }}>
          Session Expiring Soon
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="session-timeout-description">
            Your session is about to expire due to inactivity. Would you like to
            extend your session to continue working?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleLogout}
            color="inherit"
            disabled={extending}
            sx={{ fontWeight: 600, textTransform: 'none' }}
          >
            Log Out
          </Button>
          <Button
            onClick={handleExtendSession}
            variant="contained"
            disabled={extending}
            startIcon={extending ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              fontWeight: 600,
              textTransform: 'none',
              bgcolor: 'var(--color-main, #69aa56)',
              '&:hover': { bgcolor: '#213c2d' },
            }}
          >
            Extend Session
          </Button>
        </DialogActions>
      </Dialog>

      <SnackbarAlert
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        message={alertMessage}
        severity={alertSeverity}
      />
    </>
  );
}
