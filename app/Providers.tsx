'use client'

import React from 'react'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Box } from '@mui/material'
import Header from '@/components/Header'
import NavigationTabs from '@/components/NavigationTabs'
import Footer from '@/components/Footer'

const theme = createTheme({
  typography: {
    fontFamily: 'var(--font-inter), Inter, sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: 'var(--font-inter), Inter, sans-serif',
          margin: 0,
          padding: 0,
        },
      },
    },
  },
})

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <Header />
          <NavigationTabs />
          <Box
            component="main"
            sx={{
              flex: 1,
              overflow: 'auto',
              bgcolor: '#f9fafb',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ flex: 1 }}>{children}</Box>
            <Footer />
          </Box>
        </Box>
      </ThemeProvider>
    </AppRouterCacheProvider>
  )
}
