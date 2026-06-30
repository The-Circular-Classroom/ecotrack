# Legacy Frontend Port Bugfix Design

## Overview

The migration from AWS/Cognito to Vercel/Supabase ported backend API routes but left the frontend as minimal placeholder pages with inline styles. The existing `app/` folder renders bare HTML forms and static text instead of the MUI-based, Tailwind-styled, brand-themed UI that existed in the legacy frontends (`eco-track-frontend/` and `cognito-frontend/`). This fix ports the legacy UI components and page implementations into the new codebase, adapting them to use Supabase cookie-based auth instead of Cognito sessionStorage tokens, while preserving all backend API routes and middleware behavior unchanged.

## Glossary

- **Bug_Condition (C)**: Any page render in the current app that outputs unstyled inline HTML instead of the MUI/Tailwind-based UI from the legacy frontends
- **Property (P)**: Pages render with MUI components, Tailwind utilities, brand theme (#69aa56), Inter font, and functional data-driven UIs matching legacy design
- **Preservation**: All backend API routes, Supabase middleware, database layer, and cookie-based auth mechanism remain unchanged
- **Legacy Frontends**: `eco-track-frontend/` (inventory, analytics, donations) and `cognito-frontend/` (auth, users, settings) — the source-of-truth for UI design
- **Providers**: The root component wrapping the app with AppRouterCacheProvider, ThemeProvider (Inter font), CssBaseline, and layout structure (Header → NavigationTabs → main → Footer)
- **Brand Theme**: Primary green #69aa56, dark green #213c2d, subtle green #b9ff9b, with Inter font family
- **createSupabaseBrowserClient()**: The function in `lib/supabase/client.ts` that provides client-side Supabase auth (replaces legacy sessionStorage tokens)

## Bug Details

### Bug Condition

The bug manifests when any page in the application renders. Every route currently outputs unstyled inline HTML or placeholder text because the migration did not port the frontend component layer, dependencies, globals, or theme configuration from the legacy frontends.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type PageRenderRequest (any route in the app)
  OUTPUT: boolean
  
  RETURN pageUsesInlineStyles(input.route)
         OR pageRendersPlaceholderText(input.route)
         OR pageLacksMUIComponents(input.route)
         OR pageLacksTailwindCSS(input.route)
         OR pageLacksBrandTheme(input.route)
END FUNCTION
```

### Examples

- **Login page** (`/login`): Expected a MUI Paper card with gradient accent, icon-adorned TextFields, visibility toggle, green Button, SnackbarAlert. Actual: bare `<input>` and `<button>` elements with inline `style` attributes.
- **Dashboard layout**: Expected Header with TCC logo + module switcher tabs + user dropdown, NavigationTabs, Footer. Actual: dark sidebar with inline styles, plain text "Dashboard" header.
- **Users page** (`/users`): Expected MUI DataGrid with pagination, CreateUserModal, edit Drawer, role chips. Actual: renders the text "Users Page" with no functionality.
- **Analytics page** (`/analytics`): Expected recharts visualizations, summary cards, filter dropdowns. Actual: renders placeholder text.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All backend API route handlers (`/api/auth/*`, `/api/inventory/*`, `/api/analytics/*`, `/api/csv/*`, `/api/donations/*`, `/api/users/*`, `/api/reports`, `/api/storage/*`, `/api/health`) continue to respond identically
- Supabase middleware continues to validate JWT via `getUser()`, redirect unauthenticated users, return 401 for unauthorized API calls, and attach `x-user-id`/`x-user-role` headers
- `POST /api/auth/login` continues to return `{ access_token, refresh_token, expires_in, user: { id, email, role } }`
- Cookie-based session management via `@supabase/ssr` middleware remains the auth mechanism (no sessionStorage tokens)
- Role values remain `Admin`, `SchoolStaff`, `PsgVolunteer`, `Parent` from `app_metadata.role`
- Next.js 15 App Router with `(auth)` and `(dashboard)` route groups, TypeScript `.tsx` format preserved
- Prisma client and database schema remain unchanged
- `lib/supabase/client.ts` and `lib/supabase/server.ts` remain unchanged

**Scope:**
All backend logic, middleware, database access, and auth infrastructure are completely unaffected. Only the frontend rendering layer (React components, styles, page implementations) is being changed.

## Hypothesized Root Cause

Based on the bug description, the root causes are:

1. **Missing Dependencies**: `package.json` lacks MUI (`@mui/material`, `@mui/icons-material`, `@mui/x-data-grid`, `@mui/material-nextjs`), Tailwind CSS (`tailwindcss`, `@tailwindcss/postcss`), Emotion (`@emotion/react`, `@emotion/styled`), recharts, and react-icons packages required by the legacy UI.

2. **Missing Theme/Provider Infrastructure**: No `Providers` component exists that wraps the app with `AppRouterCacheProvider`, `ThemeProvider` (Inter font theme), and `CssBaseline`. No `globals.css` with Tailwind imports and brand CSS variables.

3. **Missing Shared Components**: No `components/` directory with `Header`, `Footer`, `NavigationTabs`, `SnackbarAlert`, or reusable UI components that the legacy frontends use on every page.

4. **Placeholder Page Implementations**: Each page file contains static text or minimal inline-styled forms instead of functional implementations with MUI DataGrids, recharts, modals, drawers, and proper data fetching from the existing API routes.

5. **Auth Pattern Mismatch in UI**: The login page calls `supabase.auth.signInWithPassword` directly but doesn't provide proper UX (loading states, snackbar feedback, MUI styling). The legacy UI patterns for auth need adaptation to use `createSupabaseBrowserClient()` with cookie-based sessions instead of sessionStorage.

## Correctness Properties

Property 1: Bug Condition - Pages Render With MUI/Tailwind Brand UI

_For any_ page render where the bug condition holds (route currently renders inline-styled placeholder content), the fixed page SHALL render using MUI components, Tailwind CSS utilities, brand theme colors (#69aa56 primary, Inter font), and functional data-driven content matching the legacy frontend design patterns.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12**

Property 2: Preservation - Backend and Auth Infrastructure Unchanged

_For any_ API request, middleware invocation, or database operation, the fixed code SHALL produce exactly the same response as the original code, preserving all backend route behavior, Supabase middleware auth validation, cookie-based session management, role-based access control, and Prisma database access patterns.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**1. Install Missing Dependencies**

**File**: `package.json`

Add to dependencies:
- `@mui/material` ^7.x
- `@mui/icons-material` ^7.x
- `@mui/x-data-grid` ^8.x
- `@mui/material-nextjs` ^7.x
- `@emotion/cache` ^11.x
- `@emotion/react` ^11.x
- `@emotion/styled` ^11.x
- `recharts` ^3.x
- `react-icons` ^5.x

Add to devDependencies:
- `tailwindcss` ^4
- `@tailwindcss/postcss` ^4

**2. Create Global Styles and Theme Configuration**

**File**: `app/globals.css`

- Add Tailwind `@import "tailwindcss"` directive
- Add `:root` CSS variables for brand colors (--color-main: #69aa56, --color-darker: #213c2d, --color-subtle: #b9ff9b, etc.)
- Add `@theme inline` block for Tailwind theme integration
- Add body font-family rule for Inter

**File**: `postcss.config.mjs` (create)

- Configure `@tailwindcss/postcss` plugin

**3. Create Providers Component**

**File**: `components/Providers.tsx`

- Wrap app with `AppRouterCacheProvider` from `@mui/material-nextjs/v15-appRouter`
- Wrap with `ThemeProvider` using custom theme (Inter font typography)
- Include `CssBaseline` for consistent baseline styles
- Set up flex column layout: Header → NavigationTabs → main content → Footer

**4. Create Shared UI Components**

**File**: `components/Header.tsx`
- TCC logo, module switcher tabs (Inventory/Analytics), user dropdown with logout
- Adapt auth to use `createSupabaseBrowserClient()` for session checking and logout

**File**: `components/Footer.tsx`
- Green background footer with TCC logo, social links, navigation, copyright

**File**: `components/NavigationTabs.tsx`
- MUI Tabs for sub-navigation within inventory section

**File**: `components/SnackbarAlert.tsx`
- Reusable MUI Snackbar + Alert for error/success messages

**5. Update Root Layout**

**File**: `app/layout.tsx`
- Import Inter font from `next/font/google`
- Import `globals.css`
- Wrap children with `Providers` component
- Proper `<html>` and `<body>` structure

**6. Update Auth Layout and Pages**

**File**: `app/(auth)/layout.tsx`
- Centered MUI Paper card with gradient accent bar, TCC branding

**File**: `app/(auth)/login/page.tsx`
- MUI Paper, TextField (email with icon, password with visibility toggle), Button, SnackbarAlert
- Use `createSupabaseBrowserClient()` for `signInWithPassword`

**File**: `app/(auth)/register/page.tsx`
- MUI styled form with email, password, confirm password fields, role selection

**File**: `app/(auth)/reset-password/page.tsx`
- MUI form with email field, SnackbarAlert feedback

**7. Update Dashboard Layout**

**File**: `app/(dashboard)/layout.tsx`
- Remove inline-styled sidebar
- Use Providers-based layout (Header + NavigationTabs + content + Footer)
- Protect routes via session check

**8. Implement Dashboard Pages**

**File**: `app/(dashboard)/overview/page.tsx`
- Summary cards, quick stats from `/api/analytics/overview`

**File**: `app/(dashboard)/inventory/page.tsx`
- MUI DataGrid with items from `/api/inventory/items`, filter/search, CRUD operations

**File**: `app/(dashboard)/analytics/page.tsx`
- Recharts visualizations, summary cards, fetching from analytics API routes

**File**: `app/(dashboard)/users/page.tsx`
- MUI DataGrid with server-side pagination from `/api/users`, CreateUserModal, edit Drawer, delete confirmation, role chips

**File**: `app/(dashboard)/donations/page.tsx`
- Donation drives management from `/api/donations/drives`, cards/list views, CRUD

**File**: `app/(dashboard)/csv-upload/page.tsx`
- File upload with drag-and-drop, validation via `/api/csv/validate`, upload via `/api/csv/upload`, approval workflow

**File**: `app/(dashboard)/settings/page.tsx`
- User settings/profile management

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write component render tests that check for MUI class names, Tailwind utilities, brand colors, and proper component structure. Run these tests on the UNFIXED code to observe failures confirming the placeholder state.

**Test Cases**:
1. **Layout Provider Test**: Assert that root layout renders AppRouterCacheProvider and ThemeProvider (will fail on unfixed code — no MUI providers exist)
2. **Login Page Component Test**: Assert that login page renders MUI TextField, Button, and Paper components (will fail — only bare `<input>` elements exist)
3. **Dashboard Layout Test**: Assert that dashboard layout renders Header with logo and module tabs (will fail — only inline-styled sidebar exists)
4. **Data Page Test**: Assert that users page renders MUI DataGrid (will fail — only renders placeholder text)

**Expected Counterexamples**:
- No MUI components found in rendered output
- No Tailwind CSS classes applied to elements
- No brand colors in computed styles
- Possible causes: missing dependencies, missing providers, placeholder implementations

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed pages produce the expected visual and functional output.

**Pseudocode:**
```
FOR ALL route WHERE isBugCondition(route) DO
  rendered := renderPage(route)
  ASSERT hasMUIComponents(rendered)
  ASSERT hasTailwindClasses(rendered)
  ASSERT hasBrandTheme(rendered)
  ASSERT hasFunctionalContent(rendered)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all backend API requests, the fixed code produces the same responses as the original code.

**Pseudocode:**
```
FOR ALL request WHERE NOT isBugCondition(request) DO
  ASSERT apiRoute_original(request) = apiRoute_fixed(request)
  ASSERT middleware_original(request) = middleware_fixed(request)
  ASSERT database_original(request) = database_fixed(request)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many API request variations automatically
- It catches edge cases in auth middleware behavior
- It provides strong guarantees that no backend behavior changed

**Test Plan**: Observe existing API route behavior (response formats, status codes, headers) on UNFIXED code, then write tests capturing that behavior to run after the fix.

**Test Cases**:
1. **API Route Response Preservation**: Verify all API routes return identical response shapes and status codes after frontend changes
2. **Middleware Auth Preservation**: Verify middleware continues to validate JWT, attach headers, redirect unauthenticated users
3. **Auth Login Response Preservation**: Verify `POST /api/auth/login` returns `{ access_token, refresh_token, expires_in, user }` unchanged
4. **Database Access Preservation**: Verify Prisma queries in API routes produce identical results

### Unit Tests

- Test that Providers component renders MUI ThemeProvider with correct theme configuration
- Test that Header renders logo, module tabs, and user dropdown
- Test that SnackbarAlert displays messages with correct severity
- Test that login page handles form submission and error states
- Test that DataGrid pages handle loading, error, and empty states

### Property-Based Tests

- Generate random API route requests and verify response format preservation
- Generate random auth states (valid/invalid tokens) and verify middleware behavior unchanged
- Generate random page routes and verify MUI component presence in rendered output
- Test that all non-frontend operations (API calls, DB queries) produce identical results across many input variations

### Integration Tests

- Test full login flow: form submission → Supabase auth → redirect to dashboard
- Test navigation between dashboard sections with proper tab highlighting
- Test users page: load data → create user → edit user → delete user
- Test CSV upload flow: select file → validate → upload → approve
- Test analytics page loads charts with data from API
- Test logout flow: click logout → session cleared → redirect to login
