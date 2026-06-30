'use client';

import Box from '@mui/material/Box';
import MuiPagination from '@mui/material/Pagination';

interface PaginationProps {
  page: number;
  count: number;
  onChange: (event: React.ChangeEvent<unknown>, value: number) => void;
}

export default function Pagination({ page, count, onChange }: PaginationProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
      <MuiPagination
        page={page}
        count={count}
        onChange={onChange}
        color="primary"
        shape="rounded"
      />
    </Box>
  );
}
