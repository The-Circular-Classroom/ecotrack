import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export default function SnackbarAlert({ open, autoHideDuration = 2500, onClose, message, severity, icon = false }) {
    return (
        <Snackbar open={open} autoHideDuration={autoHideDuration} onClose={onClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
            <Alert
                onClose={onClose}
                severity={severity}
                variant="filled"
                sx={{ width: '100%' }}
                icon={icon}
            >
                {message}
            </Alert>
        </Snackbar>
    );
}