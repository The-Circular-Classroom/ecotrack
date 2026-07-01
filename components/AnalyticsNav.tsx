// @ts-nocheck
// apps/frontend/src/components/AnalyticsNav.js
'use client';

import { useMemo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Tabs, Tab, Box } from '@mui/material';
import { getRoleFromSession } from '@/utils/auth';

const ALL_TABS = [
  { label: 'Overall', value: '/analytics/overview', adminOnly: true },
  { label: 'School View', value: '/analytics/school', adminOnly: false },
  { label: 'Repurposing Planner', value: '/analytics/assembly', adminOnly: true },
  { label: 'Configuration', value: '/analytics/configuration', adminOnly: true },
];

function normalizePath(p) {
  if (!p) return '/analytics/overview';
  return p.replace(/\/+$/, '') || '/analytics/overview';
}

export default function AnalyticsNav() {
  const pathnameRaw = usePathname();
  const router = useRouter();
  const role = getRoleFromSession() || 'UNKNOWN';

  const tabs = useMemo(
    () => ALL_TABS.filter((t) => !t.adminOnly || role === 'TCC_ADMIN'),
    [role],
  );

  const pathname = useMemo(() => normalizePath(pathnameRaw), [pathnameRaw]);

  const currentValue = useMemo(() => {
    const match = [...tabs]
      .sort((a, b) => b.value.length - a.value.length)
      .find((t) => pathname === t.value || pathname.startsWith(`${t.value}/`));
    return match?.value ?? tabs[0]?.value ?? '/analytics/overview';
  }, [pathname, tabs]);

  const handleChange = useCallback(
    (_event, newValue) => {
      router.push(newValue);
    },
    [router],
  );

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        bgcolor: 'white',
        borderBottom: '1px solid',
        borderColor: 'rgba(229, 231, 235, 1)',
        overflowX: { xs: 'auto', md: 'hidden' },
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
      }}
    >
      <Tabs
        value={currentValue}
        onChange={handleChange}
        aria-label="analytics navigation tabs"
        variant="scrollable"
        scrollButtons={false}
        sx={{
          minHeight: 48,
          width: 'max-content',
          minWidth: '100%',
          '& .MuiTabs-scroller': {
            overflowX: 'visible !important',
          },
          '& .MuiTabs-flexContainer': {
            minWidth: 'max-content',
          },
          '& .MuiTabs-indicator': {
            backgroundColor: 'var(--color-main)',
            height: 3,
          },
        }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.value}
            label={tab.label}
            value={tab.value}
            sx={{
              minHeight: 48,
              flexShrink: 0,
              whiteSpace: 'nowrap',
              px: { xs: 1.5, sm: 2 },
              minWidth: 'fit-content',
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#6b7280',
              '&.Mui-selected': { color: 'var(--color-main)' },
              '&:hover': {
                color: 'var(--color-main)',
                backgroundColor: 'var(--header-hover)',
              },
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
}
