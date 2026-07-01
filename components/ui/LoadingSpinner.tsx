// @ts-nocheck
import { Box, CircularProgress, Typography } from '@mui/material';

export default function LoadingSpinner({ message = 'Loading...' }) {
    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={400}
            p={4}
        >
            <Box textAlign="center">
                <CircularProgress sx={{ color: 'var(--color-main)' }} />
                <Typography mt={2} color="text.secondary">
                    {message}
                </Typography>
            </Box>
        </Box>
    );
}