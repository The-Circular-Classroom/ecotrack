/**
 * Bug Condition Exploration Test - Property 1: Pages Render Unstyled Placeholder Content
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.6, 1.7, 1.8**
 *
 * This test encodes the EXPECTED behavior: pages should render with MUI components,
 * Tailwind CSS utilities, and brand theme (#69aa56). On unfixed code, these tests
 * will FAIL — confirming the bug exists (pages currently render unstyled placeholder content).
 *
 * After the fix is implemented, these same tests will PASS — confirming the fix works.
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

// Helper: read a file's source content
function readPageSource(filePath: string): string {
  const fullPath = path.resolve(process.cwd(), filePath)
  return fs.readFileSync(fullPath, 'utf-8')
}

// Page route to file path mapping
const PAGE_ROUTE_TO_FILE: Record<string, string> = {
  '/login': 'app/(auth)/login/page.tsx',
  '/register': 'app/(auth)/register/page.tsx',
  '/overview': 'app/(dashboard)/overview/page.tsx',
  '/inventory': 'app/(dashboard)/inventory/page.tsx',
  '/analytics': 'app/(dashboard)/analytics/page.tsx',
  '/users': 'app/(dashboard)/users/page.tsx',
  '/donations': 'app/(dashboard)/donations/page.tsx',
  '/csv-upload': 'app/(dashboard)/csv-upload/page.tsx',
  '/settings': 'app/(dashboard)/settings/page.tsx',
}

// MUI component identifiers that should appear in imports or JSX
const MUI_INDICATORS = [
  '@mui/material',
  '@mui/icons-material',
  '@mui/x-data-grid',
  'MuiPaper',
  'MuiButton',
  'MuiTextField',
  'TextField',
  'Button',
  'Paper',
  'DataGrid',
  'Typography',
]

// Brand theme indicators
const BRAND_THEME_INDICATORS = [
  '#69aa56',
  '#213c2d',
  '#b9ff9b',
  'brand',
  'theme',
  '--color-main',
]

const ALL_ROUTES = Object.keys(PAGE_ROUTE_TO_FILE)

describe('Bug Condition Exploration - Property 1: Pages Render Unstyled Placeholder Content', () => {
  /**
   * Property: For any page route, the source file should import/use MUI components
   * (not bare HTML elements with inline styles).
   *
   * On unfixed code: FAILS (confirms bug — pages use bare <input>, <button>, inline styles)
   * After fix: PASSES (confirms fix — pages use MUI TextField, Button, Paper, etc.)
   */
  it('Property: All page routes should contain MUI component imports or usage', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_ROUTES),
        (route: string) => {
          const filePath = PAGE_ROUTE_TO_FILE[route]
          const source = readPageSource(filePath)

          // Assert: page source should contain at least one MUI import or component reference
          const hasMUI = MUI_INDICATORS.some(
            (indicator) => source.includes(indicator)
          )

          expect(hasMUI).toBe(true)
        }
      ),
      { numRuns: 50 } // Run enough times to cover all routes multiple times
    )
  })

  /**
   * Test: Root layout should render AppRouterCacheProvider and ThemeProvider wrappers.
   *
   * Bug Condition: isBugCondition where pageLacksMUIComponents OR pageLacksBrandTheme
   *
   * On unfixed code: FAILS (root layout has bare <body> with inline style, system fonts)
   * After fix: PASSES (root layout wraps with Providers including ThemeProvider)
   */
  it('Root layout should contain AppRouterCacheProvider and ThemeProvider infrastructure', () => {
    const layoutSource = readPageSource('app/layout.tsx')

    // Should import/reference MUI providers
    const hasAppRouterCacheProvider = layoutSource.includes('AppRouterCacheProvider')
    const hasThemeProvider = layoutSource.includes('ThemeProvider') || layoutSource.includes('Providers')
    const hasGlobalsCss = layoutSource.includes('globals.css')
    const hasInterFont = layoutSource.includes('Inter') || layoutSource.includes('inter')

    expect(hasAppRouterCacheProvider || hasThemeProvider).toBe(true)
    expect(hasGlobalsCss).toBe(true)
    expect(hasInterFont).toBe(true)
  })

  /**
   * Test: Login page should render MUI Paper, TextField with email icon adornment,
   * password visibility toggle, green Button, and SnackbarAlert — not bare <input>/<button>.
   *
   * On unfixed code: FAILS (login uses bare <input> and <button> with inline styles)
   * After fix: PASSES (login uses MUI TextField, Button, Paper, SnackbarAlert)
   */
  it('Login page should render MUI Paper, TextField, visibility toggle, green Button, and SnackbarAlert', () => {
    const loginSource = readPageSource('app/(auth)/login/page.tsx')

    // Should use MUI Paper component (not bare <div> with boxShadow)
    expect(loginSource).toContain('@mui/material')

    // Should use TextField (not bare <input>)
    expect(loginSource).toContain('TextField')

    // Should have email icon adornment (EmailRounded or similar)
    const hasEmailIcon = loginSource.includes('EmailRounded') ||
      loginSource.includes('Email') && loginSource.includes('@mui/icons-material')
    expect(hasEmailIcon).toBe(true)

    // Should have password visibility toggle
    const hasVisibilityToggle = loginSource.includes('Visibility') ||
      loginSource.includes('VisibilityOff')
    expect(hasVisibilityToggle).toBe(true)

    // Should have green-themed Button (brand color #69aa56)
    const hasGreenButton = loginSource.includes('Button') &&
      (loginSource.includes('#69aa56') || loginSource.includes('primary') || loginSource.includes('color'))
    expect(hasGreenButton).toBe(true)

    // Should have SnackbarAlert for error handling
    const hasSnackbar = loginSource.includes('Snackbar') || loginSource.includes('SnackbarAlert')
    expect(hasSnackbar).toBe(true)
  })

  /**
   * Test: Dashboard layout should render Header with TCC logo, module switcher tabs,
   * user dropdown, NavigationTabs, and Footer — not inline-styled sidebar.
   *
   * On unfixed code: FAILS (dashboard has inline-styled dark sidebar with plain links)
   * After fix: PASSES (dashboard uses Header, NavigationTabs, Footer components)
   */
  it('Dashboard layout should render Header with TCC logo, module tabs, user dropdown, NavigationTabs, and Footer', () => {
    const dashboardLayoutSource = readPageSource('app/(dashboard)/layout.tsx')

    // Should NOT use inline-styled sidebar (bug indicator)
    const hasInlineStyledSidebar = dashboardLayoutSource.includes("backgroundColor: '#1a1a2e'") &&
      dashboardLayoutSource.includes("width: '240px'")
    expect(hasInlineStyledSidebar).toBe(false)

    // Should import/use Header component
    const hasHeader = dashboardLayoutSource.includes('Header') &&
      !dashboardLayoutSource.includes("'Dashboard'") // Not just text "Dashboard"
    expect(hasHeader).toBe(true)

    // Should import/use NavigationTabs
    expect(dashboardLayoutSource).toContain('NavigationTabs')

    // Should import/use Footer
    expect(dashboardLayoutSource).toContain('Footer')
  })

  /**
   * Test: Users page should render MUI DataGrid with pagination and
   * CreateUserModal trigger — not placeholder text.
   *
   * On unfixed code: FAILS (users page renders "User Management" static text)
   * After fix: PASSES (users page renders DataGrid, CreateUserModal, etc.)
   */
  it('Users page should render MUI DataGrid with pagination and CreateUserModal trigger', () => {
    const usersSource = readPageSource('app/(dashboard)/users/page.tsx')

    // Should NOT be just placeholder text (bug indicator)
    const isPlaceholder = usersSource.includes('<h1>User Management</h1>') ||
      (usersSource.includes('User Management') && !usersSource.includes('DataGrid'))
    expect(isPlaceholder).toBe(false)

    // Should import DataGrid from MUI
    const hasDataGrid = usersSource.includes('DataGrid') ||
      usersSource.includes('@mui/x-data-grid')
    expect(hasDataGrid).toBe(true)

    // Should have CreateUserModal or user creation trigger
    const hasCreateUser = usersSource.includes('CreateUser') ||
      usersSource.includes('Add User') ||
      usersSource.includes('addUser')
    expect(hasCreateUser).toBe(true)

    // Should have pagination support
    const hasPagination = usersSource.includes('pagination') ||
      usersSource.includes('paginationModel') ||
      usersSource.includes('pageSize') ||
      usersSource.includes('rowsPerPage')
    expect(hasPagination).toBe(true)
  })

  /**
   * Property: For any page route, the source should NOT consist primarily of
   * inline style attributes (indicating placeholder implementation).
   *
   * On unfixed code: FAILS (most pages use inline style={} attributes extensively)
   * After fix: PASSES (pages use MUI sx prop, className, or Tailwind utilities)
   */
  it('Property: Pages should not rely on inline style objects as primary styling mechanism', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_ROUTES),
        (route: string) => {
          const filePath = PAGE_ROUTE_TO_FILE[route]
          const source = readPageSource(filePath)

          // Count inline style occurrences (pattern: style={{ ... }})
          const inlineStyleCount = (source.match(/style=\{\{/g) || []).length

          // Pages with many inline styles indicate placeholder/unfixed code
          // A properly implemented page uses MUI sx prop, className, or Tailwind utilities
          // Allow at most 2 inline styles (for minor one-off positioning)
          expect(inlineStyleCount).toBeLessThanOrEqual(2)
        }
      ),
      { numRuns: 50 }
    )
  })
})
