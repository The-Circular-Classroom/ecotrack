'use client';

import Button, { ButtonProps } from '@mui/material/Button';

export default function CustomButton({ sx, ...rest }: ButtonProps) {
  return (
    <Button
      variant="contained"
      sx={{
        backgroundColor: '#69aa56',
        color: '#ffffff',
        '&:hover': {
          backgroundColor: '#5a9548',
        },
        ...sx,
      }}
      {...rest}
    />
  );
}
