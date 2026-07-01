// @ts-nocheck
/**
 * Standardized modal wrapper using MUI Dialog.
 * All modals across the app should use this for consistent look & feel.
 *
 * Props:
 *  - open:       boolean
 *  - onClose:    () => void
 *  - title:      string
 *  - subtitle:   string (optional)
 *  - maxWidth:   'xs' | 'sm' | 'md' | 'lg' | 'xl' (default 'md')
 *  - fullWidth:  boolean (default true)
 *  - actions:    ReactNode (optional — rendered in DialogActions)
 *  - children:   ReactNode (body content)
 *  - hideClose:  boolean (default false)
 */
'use client';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    IconButton,
    Box,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { MODAL, COLORS } from '@/components/ui/theme';

export default function StyledModal({
    open,
    onClose,
    title,
    subtitle,
    maxWidth = 'md',
    fullWidth = true,
    actions,
    children,
    hideClose = false,
}) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={maxWidth}
            fullWidth={fullWidth}
            PaperProps={{ sx: MODAL.paper }}
        >
            {/* ── Header ── */}
            <DialogTitle sx={MODAL.title}>
                <Box>
                    <Typography variant="h6" sx={MODAL.titleText}>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body2" sx={MODAL.subtitle}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                {!hideClose && (
                    <IconButton size="small" onClick={onClose} sx={MODAL.closeButton}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                )}
            </DialogTitle>

            {/* ── Content ── */}
            <DialogContent sx={MODAL.content}>{children}</DialogContent>

            {/* ── Actions ── */}
            {actions && <DialogActions sx={MODAL.actions}>{actions}</DialogActions>}
        </Dialog>
    );
}