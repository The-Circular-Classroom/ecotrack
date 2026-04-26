'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Drawer, Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';

const navItems = [
  { name: 'Inventory Collection', href: '/inventory', icon: Inventory2OutlinedIcon },
  { name: 'Update Item Status', href: '/update-status', icon: AssignmentOutlinedIcon },
  { name: 'Files Approval', href: '/file-approval', icon: CloudUploadOutlinedIcon },
  { name: 'Transaction', href: '/transactions', icon: TimelineOutlinedIcon },
];

const drawerWidth = 256;

export default function SideNav({ open, onClose }) {
  const pathname = usePathname();

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#111827', color: 'white' }}>
      {/* Logo/Brand */}
      <Box sx={{ p: 2, borderBottom: '1px solid #1f2937', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>IMS</h1>
      </Box>

      {/* Navigation Items */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 2 }}>
        <List sx={{ p: 0 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <ListItem key={item.name} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  href={item.href}
                  onClick={onClose}
                  sx={{
                    borderRadius: 1,
                    color: isActive ? 'white' : '#d1d5db',
                    bgcolor: isActive ? '#1f2937' : 'transparent',
                    '&:hover': {
                      bgcolor: '#1f2937',
                      color: 'white',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                    <Icon sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText primary={item.name} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better mobile performance
      }}
      sx={{
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
