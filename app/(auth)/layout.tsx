'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        padding: 2,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            height: 6,
            background: 'linear-gradient(90deg, #69aa56 0%, #213c2d 100%)',
          }}
        />
        <Box sx={{ padding: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography
              variant="h5"
              component="h1"
              sx={{ fontWeight: 700, color: '#213c2d' }}
            >
              EcoTrack
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', mt: 0.5 }}
            >
              The Circular Classroom
            </Typography>
          </Box>
          {children}
        </Box>
      </Paper>
    </Box>
  );
}
