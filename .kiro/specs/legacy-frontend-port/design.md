# Legacy Frontend Port Bugfix Design

## Overview

The migration from AWS/Cognito to Vercel/Supabase ported backend API routes but left the frontend as minimal placeholder pages with inline styles. The existing `app/` folder renders bare HTML forms and static text instead of the MUI-based, Tailwind-styled, brand-themed UI that existed in the legacy frontends (`eco-track-frontend/` and `cognito-frontend/`). Additionally, several pages from the cognito-frontend were never created in the new codebase (MFA, Forgot Password, Set New Password, Confirm Signup), and the supporting API endpoints required by those pages have not been implemented. This fix ports the legacy UI components and page implementations into the new codebase, creates the missing auth pages, implements the required API endpoints using Supabase auth and Prisma, and adapts the frontend to use Supabase cookie-based auth instead of Cognito sessionStorage tokens — while preserving all existing backend API routes and middleware behavior unchanged.

## Glossary

- **Bug_Condition (C)**: Any page render in the current app that outputs unstyled inline HTML instead of the MUI/Tailwind-based UI from the legacy frontends, OR a missing page/endpoint that should exist based on cognito-frontend
- **Property (P)**: Pages render with MUI components, Tailwind utilities, brand theme (#69aa56), Inter font, and functional data-driven UIs matching legacy design; missing pages exist and function; required API endpoints respond correctly
- **Preservation**: All existing backend API routes, Supabase middleware, database layer, and cookie-based auth mechanism remain unchanged; new endpoints are ADDED alongside existing ones
- **Legacy Frontends**: `eco-track-frontend/` (inventory, analytics, donations) and `cognito-frontend/` (auth, users, settings) — the source-of-truth for UI design
- **Providers**: The root component wrapping the app with AppRouterCacheProvider, ThemeProvider (Inter font), CssBaseline, and layout structure (Header → NavigationTabs → main → Footer)
- **Brand Theme**: Primary green #69aa56, dark green #213c2d, subtle green #b9ff9b, with Inter font family
- **createSupabaseBrowserClient()**: The function in `lib/supabase/client.ts` that provides client-side Supabase auth (replaces legacy sessionStorage tokens)
- **NEW_PASSWORD_REQUIRED**: A Cognito challenge that occurs on first login with a temporary password; maps to Supabase forced password update flow via `/set-new-password` page
- **MFA Challenge**: Multi-factor authentication step after successful password login; legacy uses session+code, Supabase uses factorId/challengeId pattern adapted to same UX
- **Code-based Reset**: The cognito-frontend pattern where forgot-password sends a verification CODE (not a link), entered on the reset-password page with a new password
- **SessionTracker**: Client component that monitors token expiry and calls `/api/auth/refresh` to maintain session continuity

## Bug Details

### Bug Condition

The bug manifests when any page in the application renders. Every route currently outputs unstyled inline HTML or placeholder text because the migration did not port the frontend component layer, dependencies, globals, or theme configuration from the legacy frontends. Additionally, several pages that exist in the cognito-frontend are entirely missing from the current app, and backend API endpoints required by those pages have not been implemented.

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
         OR pageIsMissingEntirely(input.route)
         OR requiredAPIEndpointMissing(input.route)
END FUNCTION
```

### Examples

- **Login page** (`/login`): Expected a MUI Paper card with gradient accent, icon-adorned TextFields, visibility toggle, green Button, SnackbarAlert. Actual: bare `<input>` and `<button>` elements with inline `style` attributes.
- **Dashboard layout**: Expected Header with TCC logo + module switcher tabs + user dropdown, NavigationTabs, Footer. Actual: dark sidebar with inline styles, plain text "Dashboard" header.
- **Users page** (`/users`): Expected MUI DataGrid with pagination, CreateUserModal, edit Drawer, role chips. Actual: renders the text "Users Page" with no functionality.
- **Analytics page** (`/analytics`): Expected recharts visualizations, summary cards, filter dropdowns. Actual: renders placeholder text.
- **MFA page** (`/mfa`): Expected a code input form for MFA verification after login. Actual: page does not exist (404).
- **Forgot Password page** (`/forgot-password`): Expected an email entry form to request a verification code. Actual: page does not exist (404).
- **Set New Password page** (`/set-new-password`): Expected a form for forced password changes (NEW_PASSWORD_REQUIRED challenge). Actual: page does not exist (404).
- **Confirm Signup page** (`/confirm-signup`): Expected a verification code entry form after registration. Actual: page does not exist (404).
- **Register page** (`/register`): Expected full form with fullName, firstName, lastName, email, phone, password, confirmPassword. Actual: bare minimal form with only email and password.
- **Settings page** (`/settings`): Expected accordion sections for Name, Email, Password, Deactivate Account. Actual: renders placeholder text.
- **API `/api/auth/forgot-password`**: Expected endpoint to send verification code to email. Actual: does not exist (current reset-password sends a link, not a code).
- **API `/api/auth/confirm-signup`**: Expected endpoint to verify signup with code. Actual: does not exist.
- **API `/api/users/list`**: Expected paginated user list with `{ data, total, page, limit }` format. Actual: endpoint format doesn't match legacy expectations.

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

3. **Missing Shared Components**: No `components/` directory with `Header`, `Footer`, `NavigationTabs`, `SnackbarAlert`, `CreateUserModal`, `StyledConfirmDialog`, `SessionTracker`, `ColorCard`, or reusable UI components that the legacy frontends use on every page.

4. **Placeholder Page Implementations**: Each page file contains static text or minimal inline-styled forms instead of functional implementations with MUI DataGrids, recharts, modals, drawers, and proper data fetching from the existing API routes.

5. **Auth Pattern Mismatch in UI**: The login page calls `supabase.auth.signInWithPassword` directly but doesn't provide proper UX (loading states, snackbar feedback, MUI styling). The legacy UI patterns for auth need adaptation to use `createSupabaseBrowserClient()` with cookie-based sessions instead of sessionStorage.

6. **Missing Auth Pages**: Several cognito-frontend auth pages were never created in the new codebase: MFA verification (`/mfa`), Forgot Password (`/forgot-password`), Set New Password (`/set-new-password`), and Confirm Signup (`/confirm-signup`). These represent entire user flows that are unavailable.

7. **Incomplete Register Page**: The current register page only has email/password fields. The cognito-frontend version has fullName, firstName, lastName, email, phone, password, confirmPassword — a much richer registration flow.

8. **Missing API Endpoints for Auth Flows**: The new auth pages require backend endpoints that don't exist: `POST /api/auth/forgot-password` (code-based, not link-based), `POST /api/auth/set-new-password` (for NEW_PASSWORD_REQUIRED challenge), `POST /api/auth/confirm-signup` (verify signup code), `POST /api/auth/verify-mfa` (adapted MFA flow), `GET /api/auth/me` (user profile), `PATCH /api/auth/me` (update profile), `DELETE /api/auth/me` (deactivate account), `POST /api/auth/verify-user-update` (email change verification), and `POST /api/auth/refresh` (token refresh).

9. **Missing User Management API Endpoints**: The Users page needs paginated listing (`GET /api/users/list` with `?page=&limit=&username=` returning `{ data, total, page, limit }`), user creation with legacy fields (assignedRole, schoolId), current user info (`GET /api/users/me`), and school listing (`GET /api/schools`) for dropdown population.

10. **Settings Page Not Implemented**: The Settings page needs full profile management with accordion sections for Name, Email, Password, and Deactivate Account — all relying on the `/api/auth/me` endpoints.

## Correctness Properties

Property 1: Bug Condition - Pages Render With MUI/Tailwind Brand UI

_For any_ page render where the bug condition holds (route currently renders inline-styled placeholder content), the fixed page SHALL render using MUI components, Tailwind CSS utilities, brand theme colors (#69aa56 primary, Inter font), and functional data-driven content matching the legacy frontend design patterns.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12**

Property 2: Preservation - Backend and Auth Infrastructure Unchanged

_For any_ API request, middleware invocation, or database operation targeting EXISTING endpoints, the fixed code SHALL produce exactly the same response as the original code, preserving all backend route behavior, Supabase middleware auth validation, cookie-based session management, role-based access control, and Prisma database access patterns.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

Property 3: Missing Auth Pages - Complete Auth Flow Coverage

_For any_ authentication flow that exists in the cognito-frontend (MFA verification, forgot password code flow, set new password for forced change, confirm signup with code), the fixed codebase SHALL provide a corresponding page under `app/(auth)/` with MUI-styled forms, proper Supabase-based API integration, and error/success feedback matching the legacy UX.

**Validates: Requirements 2.3, 2.4, 2.5, 2.12**

Property 4: Missing API Endpoints - Auth and User Management

_For any_ frontend page that requires a backend endpoint not currently present (forgot-password code flow, confirm-signup verification, set-new-password challenge, user profile CRUD, paginated user listing, school listing), the fixed codebase SHALL provide a new API route handler that implements the required functionality using Supabase auth and Prisma, returns responses compatible with the frontend expectations, and does NOT modify any existing endpoint behavior.

**Validates: Requirements 2.4, 2.5, 2.6, 2.8, 2.12, 3.1**

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

**File**: `components/CreateUserModal.tsx`
- Tailwind-styled modal form for creating users (firstName, lastName, email, phone, role, school dropdown)
- Fetches school list from `GET /api/schools`
- Calls `POST /api/users/create` on submit

**File**: `components/StyledConfirmDialog.tsx`
- Reusable MUI Dialog for delete/deactivate confirmations with cancel and confirm buttons

**File**: `components/SessionTracker.tsx`
- Client component that monitors session validity
- Calls `POST /api/auth/refresh` when token nears expiration
- Redirects to login on session expiry

**File**: `components/ColorCard.tsx`
- Styled MUI Card component with gradient/colored variants for dashboard overview

**File**: `components/ui/CustomButton.tsx`
- Themed MUI Button wrapper with brand styling

**File**: `components/ui/CustomErrorButton.tsx`
- Red-themed MUI Button for destructive actions

**File**: `components/ui/LoadingSpinner.tsx`
- Centered MUI CircularProgress with optional label

**File**: `components/ui/Pagination.tsx`
- MUI Pagination wrapper for DataGrid pages

**File**: `components/ui/StatusBadge.tsx`
- Chip-style badge for active/inactive/role status display

**5. Update Root Layout**

**File**: `app/layout.tsx`
- Import Inter font from `next/font/google`
- Import `globals.css`
- Wrap children with `Providers` component
- Proper `<html>` and `<body>` structure

**6. Create Missing Auth Pages**

**File**: `app/(auth)/layout.tsx`
- Centered MUI Paper card with gradient accent bar, TCC branding

**File**: `app/(auth)/login/page.tsx`
- MUI Paper, TextField (email with icon, password with visibility toggle), Button, SnackbarAlert
- Use `createSupabaseBrowserClient()` for `signInWithPassword`
- Handle MFA challenge response: redirect to `/mfa` with session/username in query params

**File**: `app/(auth)/register/page.tsx` (UPDATE - expand from minimal)
- Full form with fullName, firstName, lastName, email, phone, password, confirmPassword
- MUI styled with TextField components, proper validation
- Call `POST /api/auth/signup` (new endpoint)
- On success, redirect to `/confirm-signup` with username

**File**: `app/(auth)/mfa/page.tsx` (NEW)
- MFA verification code entry (6-digit input)
- Receives `session` and `username` from login redirect (query params or state)
- Call `POST /api/auth/verify-mfa` with `{ mfaCode, session, username }`
- On success, store tokens and redirect to dashboard
- MUI Paper card with code input, Submit button, SnackbarAlert

**File**: `app/(auth)/forgot-password/page.tsx` (NEW)
- Email entry form to request verification code
- Call `POST /api/auth/forgot-password` with `{ email }`
- On success, redirect to `/reset-password` with username
- MUI Paper card with email TextField, Submit button, link back to login

**File**: `app/(auth)/reset-password/page.tsx` (UPDATE)
- Change from link-based flow to code-based flow matching cognito-frontend
- Fields: verification code, new password, confirm password
- Call `POST /api/auth/reset-password` with `{ username, code, newPassword }`
- On success, redirect to login with success message
- Keep existing link-based endpoint (`POST /api/auth/reset-password`) working for backward compatibility; add code-based logic

**File**: `app/(auth)/set-new-password/page.tsx` (NEW)
- For forced password changes (NEW_PASSWORD_REQUIRED challenge after first login)
- Receives `session` and `username` from login redirect
- Fields: new password, confirm password
- Call `POST /api/auth/set-new-password` with `{ session, username, password, confirmPassword }`
- On success, store tokens and redirect to dashboard

**File**: `app/(auth)/confirm-signup/page.tsx` (NEW)
- Verification code entry after registration
- Receives `username` from register redirect
- Fields: verification code (6-digit)
- Call `POST /api/auth/confirm-signup` with `{ username, code }`
- On success, redirect to login with success message
- Resend code option

**7. Update Dashboard Layout**

**File**: `app/(dashboard)/layout.tsx`
- Remove inline-styled sidebar
- Use Providers-based layout (Header + NavigationTabs + content + Footer)
- Protect routes via session check
- Include `SessionTracker` component for automatic token refresh

**8. Implement Dashboard Pages**

**File**: `app/(dashboard)/overview/page.tsx`
- Card-based landing page showing module links (Inventory Management, Carbon Tracker, Future Modules)
- Decorative gradient background matching cognito-frontend auth lobby
- ColorCard components for each module
- Summary stats from `/api/analytics/overview`

**File**: `app/(dashboard)/inventory/page.tsx`
- MUI DataGrid with items from `/api/inventory/items`, filter/search, CRUD operations

**File**: `app/(dashboard)/analytics/page.tsx`
- Recharts visualizations, summary cards, fetching from analytics API routes

**File**: `app/(dashboard)/users/page.tsx`
- MUI DataGrid with server-side pagination from `GET /api/users/list` (new endpoint)
- Query params: `?page=&limit=&username=` for filtering
- "Add User" button → `CreateUserModal` calling `POST /api/users/create`
- Edit Drawer for updating user details via `PATCH /api/users/[id]`
- Sync button to refresh data
- Delete dialog using `StyledConfirmDialog` calling `DELETE /api/users/[id]`
- Role chips (Admin, SchoolStaff, PsgVolunteer, Parent)
- Active/inactive status indicators via `StatusBadge`

**File**: `app/(dashboard)/donations/page.tsx`
- Donation drives management from `/api/donations/drives`, cards/list views, CRUD

**File**: `app/(dashboard)/csv-upload/page.tsx`
- File upload with drag-and-drop, validation via `/api/csv/validate`, upload via `/api/csv/upload`, approval workflow

**File**: `app/(dashboard)/settings/page.tsx` (UPDATE from placeholder)
- Accordion sections:
  - **Name**: Display and edit firstName/lastName/fullName via `PATCH /api/auth/me`
  - **Email**: Change email with verification code via `PATCH /api/auth/me` + `POST /api/auth/verify-user-update`
  - **Password**: Change password via `PATCH /api/auth/me` (requires current password)
  - **Deactivate Account**: Confirmation dialog, call `DELETE /api/auth/me`
- Fetch current user data from `GET /api/auth/me`
- SnackbarAlert for success/error feedback

**9. Create Missing Auth API Endpoints**

**File**: `app/api/auth/signup/route.ts` (NEW)
- `POST /api/auth/signup`
- Accept: `{ fullName, firstName, lastName, phoneNumber, email, password }`
- Use Supabase `signUp` with user_metadata for name fields
- Return: `{ success: true, message: "Verification code sent", session: null }`
- Store firstName, lastName, fullName, phone in user_metadata

**File**: `app/api/auth/forgot-password/route.ts` (NEW)
- `POST /api/auth/forgot-password`
- Accept: `{ email }`
- Use Supabase `resetPasswordForEmail` with code-based flow (or OTP)
- Return: `{ success: true, message: "Verification code sent to email" }`
- Note: This is SEPARATE from existing `/api/auth/reset-password` which sends a link

**File**: `app/api/auth/set-new-password/route.ts` (NEW)
- `POST /api/auth/set-new-password`
- Accept: `{ session, username, password, confirmPassword }`
- Validate passwords match
- Use Supabase `updateUser` to set new password (for forced password change scenarios)
- Return: `{ success: true, access_token, refresh_token, expires_in }`

**File**: `app/api/auth/confirm-signup/route.ts` (NEW)
- `POST /api/auth/confirm-signup`
- Accept: `{ username, code }`
- Use Supabase `verifyOtp` with type 'signup' or email verification
- Return: `{ success: true, message: "Email verified successfully" }`

**File**: `app/api/auth/verify-mfa/route.ts` (NEW)
- `POST /api/auth/verify-mfa`
- Accept: `{ mfaCode, session, username }`
- Use Supabase MFA `challengeAndVerify` or `verifyOtp`
- Adapt from existing `/api/auth/mfa` factorId/challengeId pattern to accept code + session
- Return: `{ success: true, access_token, refresh_token, expires_in, user }`

**File**: `app/api/auth/me/route.ts` (NEW)
- `GET /api/auth/me` - Get current user profile
  - Extract user from middleware headers (`x-user-id`)
  - Fetch user details from Supabase auth + Prisma user table
  - Return: `{ fullName, firstName, lastName, email, roles, username, phone }`
- `PATCH /api/auth/me` - Update current user profile
  - Accept: fields to update (name, email, password change with currentPassword)
  - Use Supabase `updateUser` for auth fields, Prisma for profile fields
  - For email change: triggers verification code flow
  - Return: `{ success: true, message, requiresVerification?: boolean }`
- `DELETE /api/auth/me` - Deactivate own account
  - Extract user from middleware headers
  - Soft-delete or deactivate in database via Prisma
  - Sign out from Supabase
  - Return: `{ success: true, message: "Account deactivated" }`

**File**: `app/api/auth/verify-user-update/route.ts` (NEW)
- `POST /api/auth/verify-user-update`
- Accept: `{ code, type }` (type = 'email_change')
- Use Supabase `verifyOtp` for email change confirmation
- Return: `{ success: true, message: "Email updated successfully" }`

**File**: `app/api/auth/refresh/route.ts` (NEW)
- `POST /api/auth/refresh`
- Accept: `{ refreshToken }` (or use cookie-based session)
- Use Supabase `refreshSession`
- Return: `{ access_token, refresh_token, expires_in }`
- Note: In cookie-based auth this may be handled by middleware, but endpoint exists for explicit refresh

**10. Create Missing User Management API Endpoints**

**File**: `app/api/users/list/route.ts` (NEW)
- `GET /api/users/list`
- Query params: `?page=1&limit=10&username=` for filtering/pagination
- Use Prisma to query users with pagination (skip/take)
- Return: `{ data: [...users], total: number, page: number, limit: number }`
- Each user object: `{ id, username, email, firstName, lastName, fullName, role, schoolId, schoolName, isActive, createdAt }`

**File**: `app/api/users/create/route.ts` (NEW)
- `POST /api/users/create`
- Accept: `{ firstName, lastName, email, phone, assignedRole, schoolId }`
- Use Supabase admin `createUser` to create auth user
- Use Prisma to create user profile record with role and school association
- Return: `{ success: true, user: { id, email, role, ... } }`
- Requires Admin role (check `x-user-role` header)

**File**: `app/api/users/me/route.ts` (NEW)
- `GET /api/users/me`
- Extract user from middleware headers (`x-user-id`)
- Fetch user with school info from Prisma (join with school table)
- Return: `{ id, email, firstName, lastName, fullName, role, school: { id, name }, phone, isActive }`

**File**: `app/api/schools/route.ts` (NEW)
- `GET /api/schools`
- Fetch all schools from Prisma
- Return: `{ data: [{ id, name, address, ... }] }`
- Used by CreateUserModal dropdown for school selection

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior. Given the addition of new pages and API endpoints, testing also covers the new functionality in isolation.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write component render tests that check for MUI class names, Tailwind utilities, brand colors, and proper component structure. Also verify that missing pages return 404 and missing API endpoints return errors. Run these tests on the UNFIXED code to observe failures confirming the placeholder state.

**Test Cases**:
1. **Layout Provider Test**: Assert that root layout renders AppRouterCacheProvider and ThemeProvider (will fail on unfixed code — no MUI providers exist)
2. **Login Page Component Test**: Assert that login page renders MUI TextField, Button, and Paper components (will fail — only bare `<input>` elements exist)
3. **Dashboard Layout Test**: Assert that dashboard layout renders Header with logo and module tabs (will fail — only inline-styled sidebar exists)
4. **Data Page Test**: Assert that users page renders MUI DataGrid (will fail — only renders placeholder text)
5. **MFA Page Existence Test**: Assert that `/mfa` route renders a form (will fail — page does not exist, returns 404)
6. **Forgot Password Page Test**: Assert that `/forgot-password` route renders an email form (will fail — page does not exist)
7. **Confirm Signup Page Test**: Assert that `/confirm-signup` route renders a code input (will fail — page does not exist)
8. **Set New Password Page Test**: Assert that `/set-new-password` route renders a password form (will fail — page does not exist)
9. **Register Page Completeness Test**: Assert that register page has fullName, firstName, lastName, phone fields (will fail — only email/password exist)
10. **Settings Page Functionality Test**: Assert that settings page renders accordion sections (will fail — placeholder text only)
11. **API Forgot Password Test**: Assert `POST /api/auth/forgot-password` returns 200 (will fail — endpoint does not exist)
12. **API Confirm Signup Test**: Assert `POST /api/auth/confirm-signup` returns 200 (will fail — endpoint does not exist)
13. **API User Profile Test**: Assert `GET /api/auth/me` returns user data (will fail — endpoint does not exist)
14. **API Users List Test**: Assert `GET /api/users/list?page=1&limit=10` returns paginated data (will fail — endpoint does not exist)

**Expected Counterexamples**:
- No MUI components found in rendered output
- No Tailwind CSS classes applied to elements
- No brand colors in computed styles
- 404 responses for missing pages
- 404/405 responses for missing API endpoints
- Possible causes: missing dependencies, missing providers, placeholder implementations, pages never created, endpoints never implemented

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed pages produce the expected visual and functional output, and new API endpoints respond correctly.

**Pseudocode:**
```
FOR ALL route WHERE isBugCondition(route) DO
  rendered := renderPage(route)
  ASSERT hasMUIComponents(rendered)
  ASSERT hasTailwindClasses(rendered)
  ASSERT hasBrandTheme(rendered)
  ASSERT hasFunctionalContent(rendered)
END FOR

FOR ALL endpoint WHERE requiredAPIEndpointMissing(endpoint) DO
  response := callEndpoint(endpoint, validPayload)
  ASSERT response.status IN [200, 201]
  ASSERT response.body matches expectedSchema
END FOR
```

### Preservation Checking

**Goal**: Verify that for all backend API requests to EXISTING endpoints, the fixed code produces the same responses as the original code.

**Pseudocode:**
```
FOR ALL request WHERE NOT isBugCondition(request) AND isExistingEndpoint(request) DO
  ASSERT apiRoute_original(request) = apiRoute_fixed(request)
  ASSERT middleware_original(request) = middleware_fixed(request)
  ASSERT database_original(request) = database_fixed(request)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many API request variations automatically
- It catches edge cases in auth middleware behavior
- It provides strong guarantees that no existing backend behavior changed

**Test Plan**: Observe existing API route behavior (response formats, status codes, headers) on UNFIXED code, then write tests capturing that behavior to run after the fix.

**Test Cases**:
1. **API Route Response Preservation**: Verify all EXISTING API routes return identical response shapes and status codes after changes
2. **Middleware Auth Preservation**: Verify middleware continues to validate JWT, attach headers, redirect unauthenticated users
3. **Auth Login Response Preservation**: Verify `POST /api/auth/login` returns `{ access_token, refresh_token, expires_in, user }` unchanged
4. **Database Access Preservation**: Verify Prisma queries in existing API routes produce identical results
5. **Existing Reset Password Preservation**: Verify `POST /api/auth/reset-password` (link-based) continues to work alongside new forgot-password code flow
6. **Existing Register Preservation**: Verify `POST /api/auth/register` continues to work alongside new signup endpoint
7. **Existing MFA Preservation**: Verify `POST /api/auth/mfa` (factorId/challengeId pattern) continues to work alongside new verify-mfa endpoint

### Unit Tests

- Test that Providers component renders MUI ThemeProvider with correct theme configuration
- Test that Header renders logo, module tabs, and user dropdown
- Test that SnackbarAlert displays messages with correct severity
- Test that login page handles form submission and error states
- Test that DataGrid pages handle loading, error, and empty states
- Test MFA page renders code input and handles submission
- Test Forgot Password page validates email and handles API response
- Test Set New Password page validates password match and handles session
- Test Confirm Signup page renders code input and handles resend
- Test Register page validates all fields (fullName, firstName, lastName, email, phone, password match)
- Test Settings page accordion sections expand/collapse and submit changes
- Test CreateUserModal validates form fields and handles school dropdown
- Test StyledConfirmDialog renders with correct message and handles cancel/confirm
- Test SessionTracker calls refresh endpoint before token expiry

### New API Endpoint Unit Tests

- Test `POST /api/auth/signup` validates required fields, calls Supabase signUp, returns correct format
- Test `POST /api/auth/forgot-password` validates email, initiates code flow, returns success
- Test `POST /api/auth/set-new-password` validates password match, handles session, returns tokens
- Test `POST /api/auth/confirm-signup` validates code format, verifies OTP, returns success
- Test `POST /api/auth/verify-mfa` validates code, verifies challenge, returns tokens
- Test `GET /api/auth/me` extracts user from headers, fetches profile, returns user data
- Test `PATCH /api/auth/me` validates fields, updates profile, handles email verification flow
- Test `DELETE /api/auth/me` deactivates account, signs out, returns success
- Test `POST /api/auth/verify-user-update` validates code, confirms email change
- Test `POST /api/auth/refresh` refreshes session, returns new tokens
- Test `GET /api/users/list` handles pagination params, filters by username, returns paginated format
- Test `POST /api/users/create` validates Admin role, creates user in Supabase and Prisma
- Test `GET /api/users/me` fetches user with school join
- Test `GET /api/schools` returns list of all schools

### Property-Based Tests

- Generate random API route requests to EXISTING endpoints and verify response format preservation
- Generate random auth states (valid/invalid tokens) and verify middleware behavior unchanged
- Generate random page routes and verify MUI component presence in rendered output
- Test that all non-frontend operations (API calls, DB queries) produce identical results across many input variations
- Generate random valid/invalid payloads for new auth endpoints and verify error handling consistency
- Generate random pagination parameters for users list and verify correct offset/limit behavior
- Generate random user profile update combinations and verify partial update handling

### Integration Tests

- Test full login flow: form submission → Supabase auth → redirect to dashboard
- Test full login with MFA flow: login → MFA challenge → code entry → dashboard redirect
- Test full registration flow: register form → signup API → confirm-signup page → code verification → login
- Test forgot password flow: forgot-password page → code sent → reset-password page → code + new password → login
- Test set new password flow: login → NEW_PASSWORD_REQUIRED → set-new-password page → success → dashboard
- Test navigation between dashboard sections with proper tab highlighting
- Test users page: load data → create user → edit user → delete user (with paginated list)
- Test settings page: view profile → edit name → change email → verify code → change password → deactivate
- Test CSV upload flow: select file → validate → upload → approve
- Test analytics page loads charts with data from API
- Test logout flow: click logout → session cleared → redirect to login
- Test session refresh: token nears expiry → SessionTracker refreshes → session continues
- Test school dropdown in CreateUserModal populated from `/api/schools`

### Adaptation Notes for Testing

When testing the new API endpoints, account for Supabase-specific patterns:
- Cookie-based auth means `x-user-id` and `x-user-role` headers come from middleware
- MFA uses Supabase factor/challenge pattern under the hood but frontend sends `{ mfaCode, session, username }`
- The "session" from Cognito challenge flows maps to Supabase's challenge state
- Password reset code flow may use Supabase OTP verification rather than Cognito's confirmForgotPassword
- Account deactivation is a soft-delete in the database (Prisma), not a Cognito AdminDisableUser
