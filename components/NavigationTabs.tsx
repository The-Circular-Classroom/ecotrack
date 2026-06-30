'use client';

import { useMemo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

const TABS = [
  { label: 'Overview', value: '/overview' },
  { label: 'Inventory', value: '/inventory' },
  { label: 'Analytics', value: '/analytics' },
  { label: 'Users', value: '/users' },
  { label: 'Donations', value: '/donations' },
  { label: 'CSV Upload', value: '/csv-upload' },
  { label: 'Settings', value: '/settings' },
];

export default function NavigationTabs() {
  const pathname = usePathname();
  const router = useRouter();

  const currentValue = useMemo(() => {
    const matched = TABS.find(
      (tab) => pathname === tab.value || pathname?.startsWith(tab.value + '/')
    );
    return matched ? matched.value : false;
  }, [pathname]);

  const handleChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      router.push(newValue);
    },
    [router]
  );

  return (
    <Box
      sx={{
        bgcolor: 'white',
        borderBottom: '1px solid',
        borderColor: 'divider',
        overflowX: { xs: 'auto', md: 'hidden' },
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      <Tabs
        value={currentValue}
        onChange={handleChange}
        aria-label="Dashboard navigation tabs"
        variant="scrollable"
        scrollButtons={false}
        sx={{
          minHeight: 44,
          '& .MuiTabs-indicator': {
            backgroundColor: '#69aa56',
            height: 3,
          },
        }}
      >
        {TABS.map((tab) => (
          <Tab
            key={tab.value}
            label={tab.label}
            value={tab.value}
            sx={{
              minHeight: 44,
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              px: { xs: 1.5, sm: 2 },
              color: '#6b7280',
              '&.Mui-selected': { color: '#69aa56' },
              '&:hover': {
                color: '#69aa56',
                backgroundColor: 'rgba(105, 170, 86, 0.04)',
              },
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
}
