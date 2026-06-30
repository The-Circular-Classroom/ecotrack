'use client';

import Button, { ButtonProps } from '@mui/material/Button';

export default function CustomErrorButton({ sx, ...rest }: ButtonProps) {
  return (
    <Button
      variant="contained"
      color="error"
      sx={{
        ...sx,
      }}
      {...rest}
    />
  );
}
