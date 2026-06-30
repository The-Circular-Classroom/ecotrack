import Box from '@mui/material/Box';
import Header from '@/components/Header';
import NavigationTabs from '@/components/NavigationTabs';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <NavigationTabs />
      <Box component="main" sx={{ flex: 1, p: 3, bgcolor: '#f9fafb' }}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
}
