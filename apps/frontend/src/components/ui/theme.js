/**
 * Centralized MUI theme constants for consistent styling across the app.
 * Import from '@/components/ui/theme' in any component or page.
 */

// ── Brand colours ────────────────────────────────────────────────────────────
export const COLORS = {
    primary: '#69aa56',           // var(--color-main)
    primaryHover: '#5a9448',      // var(--color-main-hover)
    primaryDark: '#213c2d',       // var(--color-darker)
    primaryLight: '#b9ff9b',      // var(--color-subtle)
    primaryBg: '#f0fdf4',         // light green tint for hover rows

    error: '#d32f2f',
    errorHover: '#b71c1c',
    errorBg: '#fef2f2',

    warning: '#ed6c02',
    warningBg: '#fff7ed',

    info: '#0288d1',
    infoBg: '#eff6ff',

    success: '#2e7d32',
    successBg: '#f0fdf4',

    textPrimary: '#111827',
    textSecondary: '#6b7280',
    textDisabled: '#9ca3af',

    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    cardBg: '#ffffff',
    pageBg: '#f9fafb',
};

// ── Status colour mapping (for Chips / Badges) ──────────────────────────────
export const STATUS_CONFIG = {
    GeneralOffice: { label: 'General Office', color: 'info' },
    ForSale: { label: 'For Sale', color: 'warning' },
    Sold: { label: 'Sold', color: 'error' },
    Donated: { label: 'Donated', color: 'success' },
    ForRepurpose: { label: 'For Repurpose', color: 'info' },
    Repurposed: { label: 'Repurposed', color: 'success' },
    Disposed: { label: 'Disposed', color: 'default' },
    // File approval statuses
    Approved: { label: 'Approved', color: 'success' },
    Pending:  { label: 'Pending',  color: 'warning' },
    Failed:   { label: 'Failed',   color: 'error' },
};

export const getStatusLabel = (status) =>
    STATUS_CONFIG[status]?.label ?? status ?? '—';

export const getStatusColor = (status) =>
    STATUS_CONFIG[status]?.color ?? 'default';

// ── Stored-at labels ─────────────────────────────────────────────────────────
export const STORED_AT_LABELS = {
    School: 'School',
    TCC: 'TCC',
    Exited: 'Exited',
};

// ── Button sx presets ────────────────────────────────────────────────────────
export const BTN = {
    /** Green primary action (Add, Create, Confirm, Save) */
    primary: {
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.875rem',
        borderRadius: '8px',
        px: 2.5,
        py: 1,
        backgroundColor: COLORS.primary,
        color: '#fff',
        boxShadow: 'none',
        '&:hover': { backgroundColor: COLORS.primaryHover, boxShadow: 'none' },
        '&:disabled': { opacity: 0.5 },
    },

    /** Outlined green secondary (Refresh, Download Template) */
    secondary: {
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.875rem',
        borderRadius: '8px',
        px: 2.5,
        py: 1,
        borderColor: COLORS.primary,
        color: COLORS.primary,
        '&:hover': {
            borderColor: COLORS.primaryDark,
            backgroundColor: 'rgba(105, 170, 86, 0.04)',
        },
    },

    /** Red destructive (Delete, Deny/Reject) */
    danger: {
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.875rem',
        borderRadius: '8px',
        px: 2.5,
        py: 1,
        backgroundColor: COLORS.error,
        color: '#fff',
        boxShadow: 'none',
        '&:hover': { backgroundColor: COLORS.errorHover, boxShadow: 'none' },
        '&:disabled': { opacity: 0.5 },
    },

    /** Outlined red (Deny, Reject) */
    dangerOutlined: {
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.875rem',
        borderRadius: '8px',
        px: 2.5,
        py: 1,
        borderColor: COLORS.error,
        color: COLORS.error,
        '&:hover': {
            borderColor: COLORS.errorHover,
            backgroundColor: 'rgba(211, 47, 47, 0.04)',
        },
    },

    /** Outlined grey (Cancel) */
    cancel: {
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.875rem',
        borderRadius: '8px',
        px: 2.5,
        py: 1,
        borderColor: COLORS.border,
        color: COLORS.textSecondary,
        '&:hover': { borderColor: COLORS.textDisabled, backgroundColor: COLORS.pageBg },
    },

    /** Green approve */
    approve: {
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.875rem',
        borderRadius: '8px',
        px: 2.5,
        py: 1,
        backgroundColor: '#16a34a',
        color: '#fff',
        boxShadow: 'none',
        '&:hover': { backgroundColor: '#15803d', boxShadow: 'none' },
    },
};

// ── Modal / Dialog sx presets ────────────────────────────────────────────────
export const MODAL = {
    paper: {
        borderRadius: '12px',
        overflow: 'hidden',
    },
    title: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pb: 1.5,
        borderBottom: `1px solid ${COLORS.border}`,
    },
    titleText: {
        fontWeight: 700,
        color: COLORS.textPrimary,
    },
    subtitle: {
        mt: 0.25,
        color: COLORS.textSecondary,
        fontSize: '0.875rem',
    },
    closeButton: {
        color: COLORS.textDisabled,
        '&:hover': { color: COLORS.textSecondary },
    },
    actions: {
        px: 3,
        pb: 2.5,
        pt: 1.5,
        borderTop: `1px solid ${COLORS.border}`,
        gap: 1.5,
    },
    content: {
        pt: 2.5,
        pb: 2,
    },
};

// ── DataGrid sx preset ───────────────────────────────────────────────────────
export const DATA_GRID_SX = {
    border: 'none',
    borderRadius: 2,
    '& .MuiDataGrid-columnHeaders': {
        backgroundColor: COLORS.pageBg,
        fontWeight: 600,
    },
    '& .MuiDataGrid-row': {
        cursor: 'pointer',
        transition: 'background-color 0.15s',
    },
    '& .MuiDataGrid-row:hover': {
        backgroundColor: COLORS.primaryBg,
    },
    '& .MuiDataGrid-cell': {
        borderBottom: `1px solid ${COLORS.borderLight}`,
    },
    '& .MuiDataGrid-footerContainer': {
        borderTop: `1px solid ${COLORS.border}`,
    },
    '& .MuiDataGrid-toolbarContainer': {
        padding: '8px 16px',
        borderBottom: `1px solid ${COLORS.border}`,
    },
    '& .MuiDataGrid-cell .MuiTypography-root': {
        lineHeight: 1.3,
    },
};

// ── DataGrid container box ───────────────────────────────────────────────────
export const DATA_GRID_CONTAINER = {
    width: '100%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 2,
    boxShadow: 1,
    overflow: 'hidden',
};

// ── Search TextField sx ──────────────────────────────────────────────────────
export const SEARCH_SX = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        fontSize: '0.875rem',
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: COLORS.primary,
        },
    },
};

// ── Status chip sx shorthand ─────────────────────────────────────────────────
export const STATUS_CHIP_SX = {
    fontWeight: 600,
    fontSize: '0.75rem',
    height: 24,
};

// ── Page header styles ───────────────────────────────────────────────────────
export const PAGE_HEADER = {
    container: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 2,
        mb: 3,
    },
    title: {
        fontWeight: 700,
        color: COLORS.primaryDark,
    },
    subtitle: {
        mt: 0.5,
        color: COLORS.textSecondary,
    },
    actions: {
        display: 'flex',
        gap: 1.5,
        alignItems: 'center',
    },
};

// ── Confirm dialog styles ────────────────────────────────────────────────────
export const CONFIRM_DIALOG = {
    paper: {
        borderRadius: '12px',
        maxWidth: 440,
        width: '100%',
        p: 0,
    },
    title: {
        fontWeight: 700,
        fontSize: '1.125rem',
        color: COLORS.textPrimary,
    },
    body: {
        fontSize: '0.875rem',
        color: COLORS.textSecondary,
        lineHeight: 1.6,
    },
};