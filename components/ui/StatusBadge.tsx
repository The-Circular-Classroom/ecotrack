import Chip from '@mui/material/Chip';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | string;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const displayLabel = label ?? status.charAt(0).toUpperCase() + status.slice(1);

  const chipProps = (() => {
    switch (status) {
      case 'active':
        return {
          sx: {
            backgroundColor: '#e8f5e9',
            color: '#2e7d32',
            fontWeight: 500,
          },
        };
      case 'inactive':
        return {
          sx: {
            backgroundColor: '#f5f5f5',
            color: '#757575',
            fontWeight: 500,
          },
        };
      default:
        return {
          sx: {
            fontWeight: 500,
          },
        };
    }
  })();

  return (
    <Chip
      label={displayLabel}
      size="small"
      {...chipProps}
    />
  );
}
