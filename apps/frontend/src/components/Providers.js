'use client';

import { Inter } from "next/font/google";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import Header from "@/components/Header";
import NavigationTabs from "@/components/NavigationTabs";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const theme = createTheme({
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: 'Inter, sans-serif',
        },
      },
    },
  },
});

export default function Providers({ children }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }} className={inter.variable}>
          <Header />
          <NavigationTabs />
          <Box component="main" sx={{ flex: 1, overflow: 'auto', bgcolor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flex: 1 }}>
              {children}
            </Box>
            <Footer />
          </Box>
        </Box>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
