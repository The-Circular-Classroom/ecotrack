// apps/frontend/src/components/NavigationTabs.js
'use client';

import { useMemo, useCallback, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Tabs, Tab, Box } from '@mui/material';
import { getRoleFromSession } from '@/utils/auth';

function normalizePath(p) {
  if (!p) return '/';
  let out = p.replace(/\/+$/, '');
  if (out === '') out = '/';
  return out;
}

// Routes where the inventory nav tabs should be hidden (separate sections)
const HIDDEN_TAB_ROUTES = ['/','/analytics'];

const TABS = [
  { label: 'Inventory Collection', value: '/inventory' }, // logical inventory tab
  { label: 'Update Item Condition', value: '/update-item-condition' },
  { label: 'Files Approval', value: '/file-approval', roles: ['TCC_ADMIN'] },
  { label: 'Activity Logs', value: '/transaction', roles: ['TCC_ADMIN'] },
  { label: 'Donation Drives', value: '/donation-drives' },
  { label: 'Configuration', value: '/configuration/itemtype-preset', match: '/configuration', roles: ['TCC_ADMIN'] },
];

// External store: role is derived from sessionStorage; updates are driven by events.
// This avoids calling setState inside useEffect (required by your lint rule).
function subscribeRole(onStoreChange) {
  if (typeof window === 'undefined') return () => { };

  const onAuthChanged = () => onStoreChange();

  const onVisibility = () => {
    if (document.visibilityState === 'visible') onStoreChange();
  };

  window.addEventListener('auth-changed', onAuthChanged);
  window.addEventListener('visibilitychange', onVisibility);

  return () => {
    window.removeEventListener('auth-changed', onAuthChanged);
    window.removeEventListener('visibilitychange', onVisibility);
  };
}

function getRoleSnapshot() {
  if (typeof window === 'undefined') return 'UNKNOWN';
  return getRoleFromSession() || 'UNKNOWN';
}

function getRoleServerSnapshot() {
  return 'UNKNOWN';
}

export default function NavigationTabs() {
  const pathnameRaw = usePathname();
  const router = useRouter();
  const pathname = useMemo(() => normalizePath(pathnameRaw), [pathnameRaw]);

  // hide on auth pages and standalone sections like analytics
  const hideTabs = useMemo(() => HIDDEN_TAB_ROUTES.some((p) => p === '/' ? pathname === '/' : pathname.startsWith(p)), [pathname]);

  // ✅ Role updates without setState-in-effect
  const role = useSyncExternalStore(subscribeRole, getRoleSnapshot, getRoleServerSnapshot);

  const currentValue = useMemo(() => {
    if (pathname === '/inventory-admin') return '/inventory';
    const matched = TABS.find((t) => {
      const base = t.match || t.value;
      return pathname === t.value || pathname === base || pathname.startsWith(base + '/');
    });
    return matched ? matched.value : TABS[0].value;
  }, [pathname]);

  const visibleTabs = useMemo(() => {
    // Avoid hydration mismatches: when role is unknown, render all tabs (same behavior as your prior "mounted" logic)
    if (!role || role === 'UNKNOWN') return TABS;
    return TABS.filter((tab) => !tab.roles || tab.roles.includes(role));
  }, [role]);

  const handleChange = useCallback(
    (_event, newValue) => {
      router.push(newValue);
    },
    [router]
  );

  if (hideTabs) return null;

  return (
    <Box
      sx={{
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
        aria-label="navigation tabs"
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
        {visibleTabs.map((tab) => (
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
