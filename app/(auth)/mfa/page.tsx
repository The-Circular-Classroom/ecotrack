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
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function MfaPage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}>
      <MfaContent />
    </Suspense>
  );
}

function MfaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const factorId = searchParams.get('factorId') ?? '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
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

    if (!factorId) {
      setSnackbar({
        open: true,
        message: 'MFA factor not found. Please sign in again.',
        severity: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();

      // Use Supabase client-side MFA challenge/verify flow
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) {
        setSnackbar({
          open: true,
          message: challengeError.message,
          severity: 'error',
        });
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) {
        setSnackbar({
          open: true,
          message: verifyError.message,
          severity: 'error',
        });
        return;
      }

      setSnackbar({
        open: true,
        message: 'Verification successful! Redirecting...',
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
        MFA Verification
      </Typography>

      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', textAlign: 'center', mb: 3 }}
      >
        Enter the 6-digit code from your authenticator app.
      </Typography>

      <TextField
        id="mfa-code"
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
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify Code'}
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
