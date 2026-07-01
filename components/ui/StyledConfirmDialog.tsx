// @ts-nocheck
/**
 * Standardized confirmation dialog (delete, discard, etc.).
 *
 * Props:
 *  - open:           boolean
 *  - onClose:        () => void
 *  - onConfirm:      () => void
 *  - title:          string (e.g. "Delete Preset")
 *  - description:    ReactNode (body text)
 *  - confirmLabel:   string (default "Confirm")
 *  - cancelLabel:    string (default "Cancel")
 *  - confirmColor:   'danger' | 'primary' (default 'danger')
 *  - loading:        boolean (default false)
 */
'use client';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Button,
    CircularProgress,
} from '@mui/material';
import { CONFIRM_DIALOG, BTN, MODAL } from '@/components/ui/theme';

export default function StyledConfirmDialog({
    open,
    onClose,
    onConfirm,
    title = 'Confirm',
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmColor = 'danger',
    loading = false,
}) {
    const confirmSx = confirmColor === 'danger' ? BTN.danger : BTN.primary;

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose}
            PaperProps={{ sx: CONFIRM_DIALOG.paper }}
        >
            <DialogTitle sx={{ pb: 0.5 }}>
                <Typography sx={CONFIRM_DIALOG.title}>{title}</Typography>
            </DialogTitle>

            <DialogContent sx={{ pt: 1 }}>
                <Typography sx={CONFIRM_DIALOG.body}>{description}</Typography>
            </DialogContent>

            <DialogActions sx={MODAL.actions}>
                <Button
                    variant="outlined"
                    onClick={onClose}
                    disabled={loading}
                    fullWidth
                    sx={BTN.cancel}
                >
                    {cancelLabel}
                </Button>
                <Button
                    variant="contained"
                    onClick={onConfirm}
                    disabled={loading}
                    fullWidth
                    sx={confirmSx}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
                >
                    {loading ? `${confirmLabel}...` : confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}