import { Chip } from '@mui/material';
import { getStatusLabel, getStatusColor } from '@/components/ui/theme';

/**
 * Standardised status badge using MUI Chip.
 * Accepts either a raw enum value (e.g. "ForSale") or a display label ("For Sale").
 */

// Map display labels back to enum keys so both forms work
const LABEL_TO_KEY = {
  'General Office': 'GeneralOffice',
  'For Sale': 'ForSale',
  'Sold': 'Sold',
  'Donated': 'Donated',
  'For Repurpose': 'ForRepurpose',
  'Repurposed': 'Repurposed',
  'Disposed': 'Disposed',
  // File approval statuses
  'Approved': 'Approved',
  'Pending': 'Pending',
  'Failed': 'Failed',
};

// Soft background styles per MUI color name
const COLOR_SX = {
  success: { bgcolor: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' },
  warning: { bgcolor: '#fffbeb', color: '#b45309', border: '1px solid #fcd34d' },
  error:   { bgcolor: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' },
  info:    { bgcolor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
  default: { bgcolor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' },
};

export default function StatusBadge({ status, size = 'small' }) {
  if (!status) {
    return (
      <Chip
        label="—"
        size="small"
        sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22, borderRadius: '6px', '& .MuiChip-label': { px: 1 }, ...COLOR_SX.default }}
      />
    );
  }

  const key = LABEL_TO_KEY[status] || status;
  const colorName = getStatusColor(key);
  const colorSx = COLOR_SX[colorName] || COLOR_SX.default;

  return (
    <Chip
      label={getStatusLabel(key)}
      size="small"
      sx={{
        fontWeight: 600,
        fontSize: '0.7rem',
        height: 22,
        borderRadius: '6px',
        '& .MuiChip-label': { px: 1 },
        ...colorSx,
      }}
    />
  );
}
