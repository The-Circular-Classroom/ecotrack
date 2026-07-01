import React from 'react'

export const COLORS = {
  primary: '#69aa56',
  primaryHover: '#5a9448',
  primaryDark: '#213c2d',
  primaryLight: '#b9ff9b',
  primaryBg: '#f0fdf4',

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
}

interface StatusConfigItem {
  label: string
  color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
}

export const STATUS_CONFIG: Record<string, StatusConfigItem> = {
  GeneralOffice: { label: 'For School', color: 'info' },
  ForSale: { label: 'For PSG Activities', color: 'info' },
  Sold: { label: 'Used by PSG', color: 'info' },
  Donated: { label: 'Donated', color: 'success' },
  ForRepurpose: { label: 'For TCC Repurposing', color: 'warning' },
  Repurposed: { label: 'Repurposed by TCC', color: 'success' },
  Disposed: { label: 'Recycled/Disposed', color: 'default' },
  Approved: { label: 'Approved', color: 'success' },
  Pending: { label: 'Pending', color: 'warning' },
  Failed: { label: 'Failed', color: 'error' },
}

export const getStatusLabel = (status: string): string =>
  STATUS_CONFIG[status]?.label ?? status ?? '—'

export const getStatusColor = (status: string): any =>
  STATUS_CONFIG[status]?.color ?? 'default'

export const STORED_AT_LABELS = {
  School: 'School',
  TCC: 'TCC',
  Exited: 'Exited',
}

export const BTN = {
  primary: {
    textTransform: 'none' as const,
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
  secondary: {
    textTransform: 'none' as const,
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
  danger: {
    textTransform: 'none' as const,
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
  dangerOutlined: {
    textTransform: 'none' as const,
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
  cancel: {
    textTransform: 'none' as const,
    fontWeight: 600,
    fontSize: '0.875rem',
    borderRadius: '8px',
    px: 2.5,
    py: 1,
    borderColor: COLORS.border,
    color: COLORS.textSecondary,
    '&:hover': { borderColor: COLORS.textDisabled, backgroundColor: COLORS.pageBg },
  },
  approve: {
    textTransform: 'none' as const,
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
}

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
}

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
}

export const DATA_GRID_CONTAINER = {
  width: '100%',
  backgroundColor: COLORS.cardBg,
  borderRadius: 2,
  boxShadow: 1,
  overflow: 'hidden',
}

export const SEARCH_SX = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    fontSize: '0.875rem',
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: COLORS.primary,
    },
  },
}

export const STATUS_CHIP_SX = {
  fontWeight: 600,
  fontSize: '0.75rem',
  height: 24,
}

export const PAGE_HEADER = {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap' as const,
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
}

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
}
