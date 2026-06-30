'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import AnalyticsIcon from '@mui/icons-material/BarChartOutlined';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const MODULE_TABS = [
  { label: 'Inventory', href: '/inventory', icon: <InventoryIcon fontSize="small" /> },
  { label: 'Analytics', href: '/analytics', icon: <AnalyticsIcon fontSize="small" /> },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createSupabaseBrowserClient();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const menuOpen = Boolean(anchorEl);

  const activeTabIndex = useMemo(() => {
    if (pathname?.startsWith('/analytics')) return 1;
    if (pathname?.startsWith('/inventory')) return 0;
    return false as const;
  }, [pathname]);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setUserEmail(data.user.email);
      }
    };
    getUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    router.push(MODULE_TABS[newValue].href);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <AppBar
      position="static"
      elevation={1}
      sx={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
        {/* Left section: Logo + Module Tabs */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {/* TCC Logo */}
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 700,
              color: '#213c2d',
              letterSpacing: 1,
              cursor: 'pointer',
            }}
            onClick={() => router.push('/overview')}
          >
            TCC
          </Typography>

          {/* Module Switcher Tabs */}
          <Tabs
            value={activeTabIndex}
            onChange={handleTabChange}
            aria-label="Module navigation"
            sx={{
              minHeight: 48,
              '& .MuiTab-root': {
                minHeight: 48,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.875rem',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#69aa56',
              },
              '& .Mui-selected': {
                color: '#69aa56 !important',
              },
            }}
          >
            {MODULE_TABS.map((tab) => (
              <Tab
                key={tab.label}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                sx={{ gap: 0.5 }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Right section: User Profile Dropdown */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            onClick={handleMenuOpen}
            size="small"
            aria-controls={menuOpen ? 'user-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={menuOpen ? 'true' : undefined}
            aria-label="User profile menu"
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: '#69aa56',
                fontSize: '0.875rem',
              }}
            >
              {userEmail ? userEmail[0].toUpperCase() : <PersonIcon />}
            </Avatar>
          </IconButton>

          <Menu
            id="user-menu"
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{
              paper: {
                elevation: 3,
                sx: { minWidth: 200, mt: 1 },
              },
            }}
          >
            {userEmail && (
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Signed in as
                </Typography>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {userEmail}
                </Typography>
              </Box>
            )}
            {userEmail && <Divider />}
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
