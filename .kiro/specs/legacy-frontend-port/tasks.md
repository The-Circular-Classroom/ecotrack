# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Pages Render Unstyled Placeholder Content
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate pages lack MUI components, Tailwind classes, and brand theme
  - **Scoped PBT Approach**: Generate page routes from the set ["/login", "/register", "/reset-password", "/overview", "/inventory", "/analytics", "/users", "/donations", "/csv-upload", "/settings"] and assert each renders MUI component class names (e.g., `MuiPaper`, `MuiButton`, `MuiTextField`) and brand theme tokens
  - Test that rendering the root layout produces AppRouterCacheProvider and ThemeProvider wrappers (from Bug Condition isBugCondition: pageLacksMUIComponents OR pageLacksTailwindCSS OR pageLacksBrandTheme)
  - Test that login page renders MUI Paper, TextField with email icon adornment, password visibility toggle, green Button, and SnackbarAlert — not bare `<input>`/`<button>` elements
  - Test that dashboard layout renders Header with TCC logo, module switcher tabs, user dropdown, NavigationTabs, and Footer — not inline-styled sidebar
  - Test that users page renders MUI DataGrid with pagination and CreateUserModal trigger — not placeholder text
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists: pages render placeholder/inline-styled content)
  - Document counterexamples found (e.g., "login page renders bare `<input>` instead of MUI TextField", "users page renders 'Users Page' text instead of DataGrid")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.6, 1.7, 1.8_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Backend API Routes and Auth Infrastructure Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: `GET /api/health` returns 200 with status JSON on unfixed code
  - Observe: `POST /api/auth/login` with valid credentials returns `{ access_token, refresh_token, expires_in, user: { id, email, role } }` on unfixed code
  - Observe: `GET /api/analytics/overview` returns analytics data shape on unfixed code
  - Observe: `GET /api/inventory/items` returns paginated items shape on unfixed code
  - Observe: Middleware attaches `x-user-id` and `x-user-role` headers on unfixed code
  - Observe: Unauthenticated API requests receive 401 on unfixed code
  - Write property-based tests: for all API routes in ["/api/health", "/api/auth/login", "/api/auth/register", "/api/auth/session", "/api/inventory/*", "/api/analytics/*", "/api/csv/*", "/api/donations/*", "/api/users/*"], response format and status codes match observed baseline (from Preservation Requirements in design)
  - Write property-based test: for all request types, middleware continues to validate JWT via `getUser()`, redirect unauthenticated page requests, and return 401 for unauthorized API calls
  - Write property-based test: Prisma client module and `lib/supabase/client.ts` and `lib/supabase/server.ts` file contents remain byte-identical (no modifications to backend infrastructure)
  - Verify tests PASS on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline backend behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 3. Install missing dependencies

  - [x] 3.1 Add MUI and Emotion packages to dependencies
    - Install `@mui/material` ^7.x, `@mui/icons-material` ^7.x, `@mui/x-data-grid` ^8.x, `@mui/material-nextjs` ^7.x
    - Install `@emotion/cache` ^11.x, `@emotion/react` ^11.x, `@emotion/styled` ^11.x
    - _Bug_Condition: isBugCondition(input) where pageLacksMUIComponents(route) = true due to missing packages_
    - _Expected_Behavior: MUI components available for import and rendering_
    - _Preservation: No changes to existing API routes or backend packages_
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.2 Add Tailwind CSS, recharts, and react-icons packages
    - Install `tailwindcss` ^4 and `@tailwindcss/postcss` ^4 as devDependencies
    - Install `recharts` ^3.x and `react-icons` ^5.x as dependencies
    - _Bug_Condition: isBugCondition(input) where pageLacksTailwindCSS(route) = true due to missing packages_
    - _Expected_Behavior: Tailwind CSS utilities and chart library available_
    - _Preservation: No changes to existing API routes or backend packages_
    - _Requirements: 2.1, 2.9_

- [x] 4. Create global styles and theme configuration

  - [x] 4.1 Create `app/globals.css` with Tailwind and brand CSS variables
    - Add `@import "tailwindcss"` directive
    - Add `:root` CSS variables: `--color-main: #69aa56`, `--color-darker: #213c2d`, `--color-subtle: #b9ff9b`
    - Add `@theme inline` block for Tailwind integration
    - Add body font-family rule for Inter
    - Reference: `eco-track-frontend/apps/frontend/src/app/globals.css`
    - _Bug_Condition: isBugCondition(input) where pageLacksTailwindCSS(route) AND pageLacksBrandTheme(route)_
    - _Expected_Behavior: Brand colors and Tailwind utilities available globally_
    - _Preservation: No backend file modifications_
    - _Requirements: 2.1, 2.2_

  - [x] 4.2 Create `postcss.config.mjs` with Tailwind plugin
    - Configure `@tailwindcss/postcss` plugin for CSS processing
    - _Bug_Condition: Tailwind utilities not compiled without PostCSS config_
    - _Expected_Behavior: Tailwind directives processed into utility classes_
    - _Preservation: No backend file modifications_
    - _Requirements: 2.1_

- [x] 5. Create Providers component and shared UI components

  - [x] 5.1 Create `components/Providers.tsx`
    - Wrap with `AppRouterCacheProvider` from `@mui/material-nextjs/v15-appRouter`
    - Wrap with MUI `ThemeProvider` using custom theme (Inter font, #69aa56 primary)
    - Include `CssBaseline` for consistent baseline
    - Set up flex column layout: Header → NavigationTabs → main content area → Footer
    - Reference: `eco-track-frontend/apps/frontend/src/components/Providers.js`
    - _Bug_Condition: isBugCondition(input) where pageLacksMUIComponents(route) due to no ThemeProvider_
    - _Expected_Behavior: All child pages receive MUI theme context with brand styling_
    - _Preservation: No backend file modifications_
    - _Requirements: 2.2, 2.7_

  - [x] 5.2 Create `components/Header.tsx`
    - TCC logo, module switcher tabs (Inventory/Analytics), user profile dropdown with logout
    - Use `createSupabaseBrowserClient()` for session checking and logout (NOT sessionStorage)
    - Reference: `eco-track-frontend/apps/frontend/src/components/Header.js`
    - _Bug_Condition: Dashboard renders inline-styled sidebar instead of proper Header_
    - _Expected_Behavior: Header with logo, module tabs, user dropdown renders on all dashboard pages_
    - _Preservation: Uses existing `lib/supabase/client.ts` unchanged_
    - _Requirements: 2.7, 2.12_

  - [x] 5.3 Create `components/Footer.tsx`
    - Green background footer with TCC logo, social links, navigation links, copyright
    - Reference: `eco-track-frontend/apps/frontend/src/components/Footer.js`
    - _Bug_Condition: No footer rendered on any page_
    - _Expected_Behavior: Styled footer with branding on all pages_
    - _Preservation: No backend file modifications_
    - _Requirements: 2.7_

  - [x] 5.4 Create `components/NavigationTabs.tsx`
    - MUI Tabs for sub-navigation within dashboard sections
    - Highlight active tab based on current route
    - Reference: `eco-track-frontend/apps/frontend/src/components/NavigationTabs.js`
    - _Bug_Condition: No sub-navigation rendered in dashboard_
    - _Expected_Behavior: Tabs for inventory sub-sections render below Header_
    - _Preservation: No backend file modifications_
    - _Requirements: 2.7_

  - [x] 5.5 Create `components/SnackbarAlert.tsx`
    - Reusable MUI Snackbar + Alert for error/success messages
    - Accept severity, message, open/onClose props
    - Reference: `eco-track-frontend/apps/frontend/src/components/SnackbarAlert.js`
    - _Bug_Condition: No user feedback for async operations_
    - _Expected_Behavior: Snackbar alerts display for auth errors, CRUD success/failure_
    - _Preservation: No backend file modifications_
    - _Requirements: 2.3, 2.12_

- [x] 6. Update root layout

  - [x] 6.1 Update `app/layout.tsx`
    - Import Inter font from `next/font/google`
    - Import `globals.css`
    - Wrap children with `Providers` component
    - Proper `<html lang="en">` and `<body className={inter.className}>` structure
    - _Bug_Condition: isBugCondition(input) where root layout renders bare body with inline styles_
    - _Expected_Behavior: Root layout provides MUI/Tailwind/font infrastructure to all pages_
    - _Preservation: No changes to route groups, App Router conventions, or backend_
    - _Requirements: 2.2, 3.6_

- [x] 7. Update auth layout and pages

  - [x] 7.1 Update `app/(auth)/layout.tsx`
    - Centered container with MUI Paper card, gradient accent bar (green), TCC branding
    - _Bug_Condition: Auth pages render without card container or branding_
    - _Expected_Behavior: Auth pages wrapped in styled card with brand accent_
    - _Preservation: Route group structure `(auth)` unchanged_
    - _Requirements: 2.3, 3.6_

  - [x] 7.2 Update `app/(auth)/login/page.tsx`
    - MUI Paper, TextField (email with EmailRounded icon, password with visibility toggle)
    - Green "Sign in" Button, links to register and forgot password
    - SnackbarAlert for error/success messages
    - Use `createSupabaseBrowserClient()` for `signInWithPassword`, handle redirect
    - Loading state during auth, proper error handling
    - Reference: `cognito-frontend/apps/frontend/src/app/auth/page.js` (adapted)
    - _Bug_Condition: Login renders plain form with inline styles_
    - _Expected_Behavior: MUI-styled login with icons, toggle, feedback, and Supabase auth_
    - _Preservation: Calls existing `POST /api/auth/login` endpoint unchanged_
    - _Requirements: 2.3, 2.12, 3.3, 3.4_

  - [x] 7.3 Update `app/(auth)/register/page.tsx`
    - MUI styled form with email, password, confirm password fields
    - Role indication, proper validation UI, SnackbarAlert feedback
    - Use `createSupabaseBrowserClient()` for registration
    - _Bug_Condition: Register page renders plain inline-styled form_
    - _Expected_Behavior: MUI-styled registration with validation and feedback_
    - _Preservation: Calls existing `POST /api/auth/register` endpoint unchanged_
    - _Requirements: 2.4, 2.12_

  - [x] 7.4 Update `app/(auth)/reset-password/page.tsx`
    - MUI form with email field, SnackbarAlert feedback
    - Use `createSupabaseBrowserClient()` for password reset
    - _Bug_Condition: Reset password page renders plain inline-styled form_
    - _Expected_Behavior: MUI-styled reset form with proper feedback_
    - _Preservation: Calls existing `POST /api/auth/reset-password` endpoint unchanged_
    - _Requirements: 2.5, 2.12_

- [x] 8. Update dashboard layout

  - [x] 8.1 Update `app/(dashboard)/layout.tsx`
    - Remove inline-styled sidebar completely
    - Use Providers-based layout (Header + NavigationTabs + content + Footer already provided by Providers)
    - Protect routes via Supabase session check, redirect to `/login` if unauthenticated
    - _Bug_Condition: Dashboard renders inline-styled sidebar layout_
    - _Expected_Behavior: Dashboard uses Providers layout with Header, tabs, Footer_
    - _Preservation: Route group structure `(dashboard)` unchanged, middleware auth unchanged_
    - _Requirements: 2.7, 3.2, 3.6_

- [x] 9. Implement dashboard pages

  - [x] 9.1 Implement `app/(dashboard)/overview/page.tsx`
    - Summary cards, quick stats fetched from `GET /api/analytics/overview`
    - MUI Paper cards with Typography, loading states
    - _Bug_Condition: Overview page renders placeholder text_
    - _Expected_Behavior: Data-driven summary dashboard with cards and stats_
    - _Preservation: Calls existing API route unchanged_
    - _Requirements: 2.6_

  - [x] 9.2 Implement `app/(dashboard)/inventory/page.tsx`
    - MUI DataGrid with items from `GET /api/inventory/items`
    - Filter/search, CRUD operations via existing API routes
    - Loading states, error handling, SnackbarAlert feedback
    - Reference: `eco-track-frontend/apps/frontend/src/app/inventory/page.js`
    - _Bug_Condition: Inventory page renders placeholder text_
    - _Expected_Behavior: DataGrid with items, filter, CRUD functionality_
    - _Preservation: Calls existing `/api/inventory/*` routes unchanged_
    - _Requirements: 2.6, 3.1_

  - [x] 9.3 Implement `app/(dashboard)/analytics/page.tsx`
    - Recharts visualizations (bar, line, pie charts), summary stat cards
    - Fetch from `GET /api/analytics/overview`, `/api/analytics/collection`, `/api/analytics/assembly`
    - Filter dropdowns, responsive layout
    - Reference: `eco-track-frontend/apps/frontend/src/app/analytics/overview/page.js`
    - _Bug_Condition: Analytics page renders placeholder text_
    - _Expected_Behavior: Charts and data visualizations with real API data_
    - _Preservation: Calls existing `/api/analytics/*` routes unchanged_
    - _Requirements: 2.9, 3.1_

  - [x] 9.4 Implement `app/(dashboard)/users/page.tsx`
    - MUI DataGrid with server-side pagination from `GET /api/users`
    - "Add User" button → CreateUserModal calling `POST /api/users`
    - Edit Drawer calling `PATCH /api/users/[id]`, delete via `DELETE /api/users/[id]`
    - Role chips (Admin, SchoolStaff, PsgVolunteer, Parent), active status indicators
    - Reference: `cognito-frontend/apps/frontend/src/app/users/page.js`, `cognito-frontend/apps/frontend/src/components/CreateUserModal.js`
    - _Bug_Condition: Users page renders placeholder text "Users Page"_
    - _Expected_Behavior: Full DataGrid with CRUD, modal, drawer, role chips_
    - _Preservation: Calls existing `/api/users/*` routes unchanged_
    - _Requirements: 2.8, 3.1, 3.5_

  - [x] 9.5 Implement `app/(dashboard)/donations/page.tsx`
    - Donation drives management from `GET /api/donations/drives`
    - Cards/list views, progress indicators, CRUD operations
    - Reference: `eco-track-frontend/apps/frontend/src/app/donation-drives/page.js`
    - _Bug_Condition: Donations page renders placeholder text_
    - _Expected_Behavior: Donation drives interface with cards and CRUD_
    - _Preservation: Calls existing `/api/donations/*` routes unchanged_
    - _Requirements: 2.11, 3.1_

  - [x] 9.6 Implement `app/(dashboard)/csv-upload/page.tsx`
    - File upload with drag-and-drop, validation via `POST /api/csv/validate`
    - Upload via `POST /api/csv/upload`, approval workflow via `POST /api/csv/approve`
    - Progress indicators, validation feedback, SnackbarAlert
    - _Bug_Condition: CSV upload page renders placeholder text_
    - _Expected_Behavior: Drag-and-drop upload with validation and approval workflow_
    - _Preservation: Calls existing `/api/csv/*` routes unchanged_
    - _Requirements: 2.10, 3.1_

  - [x] 9.7 Implement `app/(dashboard)/settings/page.tsx`
    - User settings/profile management
    - MUI form fields for profile data, password change
    - _Bug_Condition: Settings page renders placeholder text_
    - _Expected_Behavior: Functional settings form with profile management_
    - _Preservation: No backend changes_
    - _Requirements: 2.6_

- [x] 10. Fix implementation verification

  - [x] 10.1 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Pages Render With MUI/Tailwind Brand UI
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (MUI components, Tailwind classes, brand theme)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed - pages now render MUI components with brand theme)
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 2.7, 2.8_

  - [x] 10.2 Verify preservation tests still pass
    - **Property 2: Preservation** - Backend API Routes and Auth Infrastructure Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions - all API routes, middleware, and auth infrastructure unchanged)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 11. Checkpoint - Ensure all tests pass
  - Run full test suite (`vitest run`) to verify all property tests pass
  - Run `next build` to verify no TypeScript errors or build failures
  - Ensure exploration test (Property 1) now passes after implementation
  - Ensure preservation tests (Property 2) still pass after implementation
  - Ask the user if questions arise
