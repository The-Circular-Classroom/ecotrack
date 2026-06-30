'use client';

import { ReactNode } from 'react';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useRouter } from 'next/navigation';

export type ColorCardVariant = 'primary' | 'dark' | 'subtle' | 'gradient';

interface ColorCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  variant?: ColorCardVariant;
}

const variantStyles: Record<ColorCardVariant, { background: string; color: string; iconColor: string }> = {
  primary: {
    background: '#69aa56',
    color: '#ffffff',
    iconColor: 'rgba(255, 255, 255, 0.85)',
  },
  dark: {
    background: '#213c2d',
    color: '#ffffff',
    iconColor: '#b9ff9b',
  },
  subtle: {
    background: 'linear-gradient(135deg, #f0fbe8 0%, #e3f5da 100%)',
    color: '#213c2d',
    iconColor: '#69aa56',
  },
  gradient: {
    background: 'linear-gradient(135deg, #69aa56 0%, #213c2d 100%)',
    color: '#ffffff',
    iconColor: '#b9ff9b',
  },
};

export default function ColorCard({
  title,
  description,
  icon,
  href,
  variant = 'gradient',
}: ColorCardProps) {
  const router = useRouter();
  const styles = variantStyles[variant];

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <CardActionArea
        onClick={() => router.push(href)}
        aria-label={`Navigate to ${title}`}
        sx={{
          background: styles.background,
          color: styles.color,
          height: '100%',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 1.5,
            }}
          >
            <Box
              sx={{
                color: styles.iconColor,
                display: 'flex',
                alignItems: 'center',
                fontSize: 36,
                '& > svg': { fontSize: 'inherit' },
              }}
            >
              {icon}
            </Box>
            <Typography variant="h6" fontWeight={700} color="inherit">
              {title}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{ opacity: 0.85, color: 'inherit' }}
          >
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
