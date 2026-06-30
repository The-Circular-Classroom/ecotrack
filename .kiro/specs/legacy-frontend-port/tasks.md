# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Pages Render Unstyled Placeholder Content and Missing Pages/Endpoints
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate pages lack MUI components, Tailwind classes, brand theme, and that required pages/endpoints are missing
  - **Scoped PBT Approach**: Generate page routes from the set ["/login", "/register", "/reset-password", "/overview", "/inventory", "/analytics", "/users", "/donations", "/csv-upload", "/settings", "/mfa", "/forgot-password", "/set-new-password", "/confirm-signup"] and assert each renders MUI component class names (e.g., `MuiPaper`, `MuiButton`, `MuiTextField`) and brand theme tokens
  - Test that rendering the root layout produces AppRouterCacheProvider and ThemeProvider wrappers
  - Test that login page renders MUI Paper, TextField with email icon adornment, password visibility toggle, green Button, and SnackbarAlert
  - Test that dashboard layout renders Header with TCC logo, module switcher tabs, user dropdown, NavigationTabs, and Footer
  - Test that users page renders MUI DataGrid with pagination and CreateUserModal trigger
  - Test that `/mfa` route renders a code input form (will fail - page does not exist)
  - Test that `/forgot-password` route renders an email form (will fail - page does not exist)
  - Test that `/set-new-password` route renders a password form (will fail - page does not exist)
  - Test that `/confirm-signup` route renders a code input (will fail - page does not exist)
  - Test that register page has fullName, firstName, lastName, phone fields (will fail - only email/password exist)
  - Test that settings page renders accordion sections for Name, Email, Password, Deactivate (will fail - placeholder only)
  - Test that `POST /api/auth/forgot-password` returns 200 (will fail - endpoint does not exist)
  - Test that `POST /api/auth/confirm-signup` returns 200 (will fail - endpoint does not exist)
  - Test that `GET /api/auth/me` returns user data (will fail - endpoint does not exist)
  - Test that `GET /api/users/list?page=1&limit=10` returns paginated data (will fail - endpoint does not exist)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "login page renders bare `<input>` instead of MUI TextField", "users page renders 'Users Page' text instead of DataGrid", "/mfa returns 404", "POST /api/auth/forgot-password returns 404")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Backend API Routes and Auth Infrastructure Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: `GET /api/health` returns 200 with status JSON on unfixed code
  - Observe: `POST /api/auth/login` with valid credentials returns `{ access_token, refresh_token, expires_in, user: { id, email, role } }` on unfixed code
  - Observe: `GET /api/analytics/overview` returns analytics data shape on unfixed code
  - Observe: `GET /api/inventory/items` returns paginated items shape on unfixed code
  - Observe: Middleware attaches `x-user-id` and `x-user-role` headers on unfixed code
  - Observe: Unauthenticated API requests receive 401 on unfixed code
  - Observe: `POST /api/auth/reset-password` (link-based) returns expected response on unfixed code
  - Observe: `POST /api/auth/register` returns expected response on unfixed code
  - Observe: `POST /api/auth/mfa` (factorId/challengeId pattern) responds correctly on unfixed code
  - Write property-based tests: for all API routes in ["/api/health", "/api/auth/login", "/api/auth/register", "/api/auth/reset-password", "/api/auth/mfa", "/api/auth/session", "/api/inventory/*", "/api/analytics/*", "/api/csv/*", "/api/donations/*", "/api/users/*"], response format and status codes match observed baseline
  - Write property-based test: for all request types, middleware continues to validate JWT via `getUser()`, redirect unauthenticated page requests, and return 401 for unauthorized API calls
  - Write property-based test: Prisma client module, `lib/supabase/client.ts`, and `lib/supabase/server.ts` file contents remain byte-identical (no modifications to backend infrastructure)
  - Write property-based test: for all random auth states (valid/invalid tokens), middleware behavior is unchanged
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
    - Set up flex column layout structure
    - _Bug_Condition: isBugCondition(input) where pageLacksMUIComponents(route) due to no ThemeProvider_
    - _Expected_Behavior: All child pages receive MUI theme context with brand styling_
    - _Preservation: No backend file modifications_
    - _Requirements: 2.2, 2.7_

  - [x] 5.2 Create `components/Header.tsx`
    - TCC logo, module switcher tabs (Inventory/Analytics), user profile dropdown with logout
    - Use `createSupabaseBrowserClient()` for session checking and logout
    - _Bug_Condition: Dashboard renders inline-styled sidebar instead of proper Header_
    - _Expected_Behavior: Header with logo, module tabs, user dropdown renders on all dashboard pages_
    - _Preservation: Uses existing `lib/supabase/client.ts` unchanged_
    - _Requirements: 2.7, 2.12_

  - [x] 5.3 Create `components/Footer.tsx`
    - Green background footer with TCC logo, social links, navigation links, copyright
    - _Bug_Condition: No footer rendered on any page_
    - _Expected_Behavior: Styled footer with branding on all pages_
    - _Preservation: No backend file modifications_
    - _Requirements: 2.7_

  - [x] 5.4 Create `components/NavigationTabs.tsx`
    - MUI Tabs for sub-navigation within dashboard sections
    - Highlight active tab based on current route
    - _Bug_Condition: No sub-navigation rendered in dashboard_
    - _Expected_Behavior: Tabs for inventory sub-sections render below Header_
    - _Preservation: No backend file modifications_
    - _Requirements: 2.7_

  - [x] 5.5 Create `components/SnackbarAlert.tsx`
    - Reusable MUI Snackbar + Alert for error/success messages
    - Accept severity, message, open/onClose props
    - _Bug_Condition: No user feedback for async operations_
    - _Expected_Behavior: Snackbar alerts display for auth errors, CRUD success/failure_
    - _Preservation: No backend file modifications_
    - _Requirements: 2.3, 2.12_

  - [x] 5.6 Create `components/CreateUserModal.tsx`
    - Tailwind-styled modal form for creating users (firstName, lastName, email, phone, role, school dropdown)
    - Fetch school list from `GET /api/schools`
    - Call `POST /api/users/create` on submit
    - _Bug_Condition: Users page has no user creation UI_
    - _Expected_Behavior: Modal with form fields, school dropdown, role selection, validation_
    - _Preservation: No backend file modifications_
    - _Requirements: 2.8_

  - [x] 5.7 Create `components/StyledConfirmDialog.tsx`
    - Reusable MUI Dialog for delete/deactivate confirmations
    - Cancel and confirm buttons with appropriate styling
    - _Bug_Condition: No confirmation dialogs for destructive actions_
    - _Expected_Behavior: Dialog prompts user before delete/deactivate operations_
    - _Preservation: No backend file modifications_
    - _Requirements: 2.8_

  - [x] 5.8 Create `components/SessionTracker.tsx`
    - Client component that monitors session validity
    - Call `POST /api/auth/refresh` when token nears expiration
    - Redirect to login on session expiry
    - _Bug_Condition: No automatic session refresh mechanism_
    - _Expected_Behavior: Session remains active via automatic token refresh_
    - _Preservation: Uses existing cookie-based session mechanism_
    - _Requirements: 2.12_

  - [x] 5.9 Create `components/ColorCard.tsx`
    - Styled MUI Card component with gradient/colored variants for dashboard overview
    - _Bug_Condition: Overview page has no styled cards_
    - _Expected_Behavior: Gradient cards for module links on overview page_
    - _Preservation: No backend file modifications_
    - _Requirements: 2.6_

  - [x] 5.10 Create UI subcomponents (`components/ui/`)
    - `CustomButton.tsx` - Themed MUI Button wrapper with brand styling
    - `CustomErrorButton.tsx` - Red-themed MUI Button for destructive actions
    - `LoadingSpinner.tsx` - Centered MUI CircularProgress with optional label
    - `Pagination.tsx` - MUI Pagination wrapper for DataGrid pages
    - `StatusBadge.tsx` - Chip-style badge for active/inactive/role status display
    - _Bug_Condition: No reusable UI components for consistent styling_
    - _Expected_Behavior: Consistent branded buttons, spinners, badges across all pages_
    - _Preservation: No backend file modifications_
    - _Requirements: 2.1, 2.6, 2.8_

- [x] 6. Update root layout and auth layout

  - [x] 6.1 Update `app/layout.tsx`
    - Import Inter font from `next/font/google`
    - Import `globals.css`
    - Wrap children with `Providers` component
    - Proper `<html lang="en">` and `<body className={inter.className}>` structure
    - _Bug_Condition: isBugCondition(input) where root layout renders bare body with inline styles_
    - _Expected_Behavior: Root layout provides MUI/Tailwind/font infrastructure to all pages_
    - _Preservation: No changes to route groups, App Router conventions, or backend_
    - _Requirements: 2.2, 3.6_

  - [x] 6.2 Update `app/(auth)/layout.tsx`
    - Centered container with MUI Paper card, gradient accent bar (green), TCC branding
    - _Bug_Condition: Auth pages render without card container or branding_
    - _Expected_Behavior: Auth pages wrapped in styled card with brand accent_
    - _Preservation: Route group structure `(auth)` unchanged_
    - _Requirements: 2.3, 3.6_

- [x] 7. Implement auth pages

  - [x] 7.1 Update `app/(auth)/login/page.tsx`
    - MUI Paper, TextField (email with EmailRounded icon, password with visibility toggle)
    - Green "Sign in" Button, links to register and forgot password
    - SnackbarAlert for error/success messages
    - Use `createSupabaseBrowserClient()` for `signInWithPassword`
    - Handle MFA challenge response: redirect to `/mfa` with session/username in query params
    - Loading state during auth, proper error handling
    - Reference: `cognito-frontend/apps/frontend/src/app/auth/page.js`
    - _Bug_Condition: Login renders plain form with inline styles_
    - _Expected_Behavior: MUI-styled login with icons, toggle, feedback, MFA redirect, and Supabase auth_
    - _Preservation: Calls existing `POST /api/auth/login` endpoint unchanged_
    - _Requirements: 2.3, 2.12, 3.3, 3.4_

  - [x] 7.2 Update `app/(auth)/register/page.tsx` (expand to full form)
    - Full form: fullName, firstName, lastName, email, phone, password, confirmPassword
    - MUI styled with TextField components, proper validation
    - Call `POST /api/auth/signup` (new endpoint)
    - On success, redirect to `/confirm-signup` with username
    - Reference: `cognito-frontend/apps/frontend/src/app/auth/register/page.js`
    - _Bug_Condition: Register page has only email/password fields_
    - _Expected_Behavior: Full registration form with all legacy fields, calls new signup endpoint_
    - _Preservation: Existing `POST /api/auth/register` endpoint remains unchanged alongside new signup_
    - _Requirements: 2.4, 2.12, 3.1_

  - [x] 7.3 Update `app/(auth)/reset-password/page.tsx` (code-based flow)
    - Change from link-based to code-based flow matching cognito-frontend
    - Fields: verification code, new password, confirm password
    - Receives `username` from forgot-password redirect
    - Call `POST /api/auth/reset-password` with `{ username, code, newPassword }`
    - On success, redirect to login with success message
    - Reference: `cognito-frontend/apps/frontend/src/app/auth/reset-password/page.js`
    - _Bug_Condition: Reset password page renders plain inline-styled form_
    - _Expected_Behavior: MUI-styled code-based reset form with verification code + new password_
    - _Preservation: Existing link-based reset-password API logic preserved for backward compatibility_
    - _Requirements: 2.5, 2.12, 3.1_

  - [x] 7.4 Create `app/(auth)/mfa/page.tsx` (NEW)
    - MFA verification code entry (6-digit input)
    - Receives `session` and `username` from login redirect (query params or state)
    - Call `POST /api/auth/verify-mfa` with `{ mfaCode, session, username }`
    - On success, store tokens and redirect to dashboard
    - MUI Paper card with code input, Submit button, SnackbarAlert
    - Reference: `cognito-frontend/apps/frontend/src/app/auth/mfa/page.js`
    - _Bug_Condition: pageIsMissingEntirely("/mfa") returns true_
    - _Expected_Behavior: MUI-styled MFA code entry page with Supabase verification_
    - _Preservation: Existing `POST /api/auth/mfa` (factorId/challengeId) remains unchanged_
    - _Requirements: 2.12, 3.1_

  - [x] 7.5 Create `app/(auth)/forgot-password/page.tsx` (NEW)
    - Email entry form to request verification code
    - Call `POST /api/auth/forgot-password` with `{ email }`
    - On success, redirect to `/reset-password` with username
    - MUI Paper card with email TextField, Submit button, link back to login
    - Reference: `cognito-frontend/apps/frontend/src/app/auth/forgot-password/page.js`
    - _Bug_Condition: pageIsMissingEntirely("/forgot-password") returns true_
    - _Expected_Behavior: MUI-styled forgot-password page that sends verification code_
    - _Preservation: No existing endpoint modified_
    - _Requirements: 2.5, 2.12_

  - [x] 7.6 Create `app/(auth)/set-new-password/page.tsx` (NEW)
    - For forced password changes (NEW_PASSWORD_REQUIRED challenge after first login)
    - Receives `session` and `username` from login redirect
    - Fields: new password, confirm password
    - Call `POST /api/auth/set-new-password` with `{ session, username, password, confirmPassword }`
    - On success, store tokens and redirect to dashboard
    - Reference: `cognito-frontend/apps/frontend/src/app/auth/set-new-password/page.js`
    - _Bug_Condition: pageIsMissingEntirely("/set-new-password") returns true_
    - _Expected_Behavior: MUI-styled forced password change page_
    - _Preservation: No existing endpoint modified_
    - _Requirements: 2.12_

  - [x] 7.7 Create `app/(auth)/confirm-signup/page.tsx` (NEW)
    - Verification code entry after registration
    - Receives `username` from register redirect
    - Fields: verification code (6-digit)
    - Call `POST /api/auth/confirm-signup` with `{ username, code }`
    - On success, redirect to login with success message
    - Resend code option
    - Reference: `cognito-frontend/apps/frontend/src/app/auth/confirm-signup/page.js`
    - _Bug_Condition: pageIsMissingEntirely("/confirm-signup") returns true_
    - _Expected_Behavior: MUI-styled signup verification page with resend capability_
    - _Preservation: No existing endpoint modified_
    - _Requirements: 2.12_

- [x] 8. Update dashboard layout and implement dashboard pages

  - [x] 8.1 Update `app/(dashboard)/layout.tsx`
    - Remove inline-styled sidebar completely
    - Use Providers-based layout (Header + NavigationTabs + content + Footer)
    - Protect routes via Supabase session check, redirect to `/login` if unauthenticated
    - Include `SessionTracker` component for automatic token refresh
    - _Bug_Condition: Dashboard renders inline-styled sidebar layout_
    - _Expected_Behavior: Dashboard uses Providers layout with Header, tabs, Footer, session tracking_
    - _Preservation: Route group structure `(dashboard)` unchanged, middleware auth unchanged_
    - _Requirements: 2.7, 2.12, 3.2, 3.6_

  - [x] 8.2 Implement `app/(dashboard)/overview/page.tsx`
    - Card-based landing page showing module links (Inventory Management, Carbon Tracker, Future Modules)
    - Decorative gradient background, ColorCard components for each module
    - Summary stats from `GET /api/analytics/overview`
    - _Bug_Condition: Overview page renders placeholder text_
    - _Expected_Behavior: Data-driven summary dashboard with ColorCards and stats_
    - _Preservation: Calls existing API route unchanged_
    - _Requirements: 2.6_

  - [x] 8.3 Implement `app/(dashboard)/inventory/page.tsx`
    - MUI DataGrid with items from `GET /api/inventory/items`
    - Filter/search, CRUD operations via existing API routes
    - Loading states, error handling, SnackbarAlert feedback
    - Reference: `eco-track-frontend/apps/frontend/src/app/inventory/page.js`
    - _Bug_Condition: Inventory page renders placeholder text_
    - _Expected_Behavior: DataGrid with items, filter, CRUD functionality_
    - _Preservation: Calls existing `/api/inventory/*` routes unchanged_
    - _Requirements: 2.6, 3.1_

  - [x] 8.4 Implement `app/(dashboard)/analytics/page.tsx`
    - Recharts visualizations (bar, line, pie charts), summary stat cards
    - Fetch from `GET /api/analytics/overview`, `/api/analytics/collection`, `/api/analytics/assembly`
    - Filter dropdowns, responsive layout
    - Reference: `eco-track-frontend/apps/frontend/src/app/analytics/overview/page.js`
    - _Bug_Condition: Analytics page renders placeholder text_
    - _Expected_Behavior: Charts and data visualizations with real API data_
    - _Preservation: Calls existing `/api/analytics/*` routes unchanged_
    - _Requirements: 2.9, 3.1_

  - [x] 8.5 Implement `app/(dashboard)/users/page.tsx`
    - MUI DataGrid with server-side pagination from `GET /api/users/list` (new endpoint)
    - Query params: `?page=&limit=&username=` for filtering
    - "Add User" button → `CreateUserModal` calling `POST /api/users/create`
    - Edit Drawer for updating user details via `PATCH /api/users/[id]`
    - Sync button to refresh data
    - Delete dialog using `StyledConfirmDialog` calling `DELETE /api/users/[id]`
    - Role chips (Admin, SchoolStaff, PsgVolunteer, Parent), StatusBadge for active/inactive
    - Reference: `cognito-frontend/apps/frontend/src/app/users/page.js`
    - _Bug_Condition: Users page renders placeholder text "Users Page"_
    - _Expected_Behavior: Full DataGrid with CRUD, modal, drawer, role chips, pagination_
    - _Preservation: Calls existing `/api/users/*` routes unchanged; new list/create endpoints added alongside_
    - _Requirements: 2.8, 3.1, 3.5_

  - [x] 8.6 Implement `app/(dashboard)/donations/page.tsx`
    - Donation drives management from `GET /api/donations/drives`
    - Cards/list views, progress indicators, CRUD operations
    - Reference: `eco-track-frontend/apps/frontend/src/app/donation-drives/page.js`
    - _Bug_Condition: Donations page renders placeholder text_
    - _Expected_Behavior: Donation drives interface with cards and CRUD_
    - _Preservation: Calls existing `/api/donations/*` routes unchanged_
    - _Requirements: 2.11, 3.1_

  - [x] 8.7 Implement `app/(dashboard)/csv-upload/page.tsx`
    - File upload with drag-and-drop, validation via `POST /api/csv/validate`
    - Upload via `POST /api/csv/upload`, approval workflow via `POST /api/csv/approve`
    - Progress indicators, validation feedback, SnackbarAlert
    - _Bug_Condition: CSV upload page renders placeholder text_
    - _Expected_Behavior: Drag-and-drop upload with validation and approval workflow_
    - _Preservation: Calls existing `/api/csv/*` routes unchanged_
    - _Requirements: 2.10, 3.1_

  - [x] 8.8 Implement `app/(dashboard)/settings/page.tsx` (full accordion profile)
    - Accordion sections: Name, Email, Password, Deactivate Account
    - Name: Display/edit firstName, lastName, fullName via `PATCH /api/auth/me`
    - Email: Change email with verification code via `PATCH /api/auth/me` + `POST /api/auth/verify-user-update`
    - Password: Change password via `PATCH /api/auth/me` (requires current password)
    - Deactivate Account: StyledConfirmDialog, call `DELETE /api/auth/me`
    - Fetch current user data from `GET /api/auth/me`
    - SnackbarAlert for success/error feedback
    - Reference: `cognito-frontend/apps/frontend/src/app/settings/page.js`
    - _Bug_Condition: Settings page renders placeholder text_
    - _Expected_Behavior: Accordion-based profile management with full CRUD_
    - _Preservation: No existing backend endpoints modified_
    - _Requirements: 2.6, 2.12_

- [x] 9. Create missing auth API endpoints

  - [x] 9.1 Create `app/api/auth/signup/route.ts`
    - `POST /api/auth/signup`
    - Accept: `{ fullName, firstName, lastName, phoneNumber, email, password }`
    - Use Supabase `signUp` with user_metadata for name fields
    - Return: `{ success: true, message: "Verification code sent", session: null }`
    - _Bug_Condition: requiredAPIEndpointMissing("/api/auth/signup")_
    - _Expected_Behavior: Endpoint creates user and triggers email verification_
    - _Preservation: Existing `POST /api/auth/register` remains unchanged_
    - _Requirements: 2.4, 3.1_

  - [x] 9.2 Create `app/api/auth/forgot-password/route.ts`
    - `POST /api/auth/forgot-password`
    - Accept: `{ email }`
    - Use Supabase `resetPasswordForEmail` with code-based flow (OTP)
    - Return: `{ success: true, message: "Verification code sent to email" }`
    - Note: SEPARATE from existing `/api/auth/reset-password` which sends a link
    - _Bug_Condition: requiredAPIEndpointMissing("/api/auth/forgot-password")_
    - _Expected_Behavior: Endpoint initiates code-based password reset flow_
    - _Preservation: Existing `POST /api/auth/reset-password` (link-based) remains unchanged_
    - _Requirements: 2.5, 3.1_

  - [x] 9.3 Create `app/api/auth/set-new-password/route.ts`
    - `POST /api/auth/set-new-password`
    - Accept: `{ session, username, password, confirmPassword }`
    - Validate passwords match
    - Use Supabase `updateUser` to set new password (forced password change scenarios)
    - Return: `{ success: true, access_token, refresh_token, expires_in }`
    - _Bug_Condition: requiredAPIEndpointMissing("/api/auth/set-new-password")_
    - _Expected_Behavior: Endpoint handles forced password change challenge_
    - _Preservation: No existing endpoints modified_
    - _Requirements: 2.12, 3.1_

  - [x] 9.4 Create `app/api/auth/confirm-signup/route.ts`
    - `POST /api/auth/confirm-signup`
    - Accept: `{ username, code }`
    - Use Supabase `verifyOtp` with type 'signup' or email verification
    - Return: `{ success: true, message: "Email verified successfully" }`
    - _Bug_Condition: requiredAPIEndpointMissing("/api/auth/confirm-signup")_
    - _Expected_Behavior: Endpoint verifies signup email code_
    - _Preservation: No existing endpoints modified_
    - _Requirements: 2.12, 3.1_

  - [x] 9.5 Create `app/api/auth/verify-mfa/route.ts`
    - `POST /api/auth/verify-mfa`
    - Accept: `{ mfaCode, session, username }`
    - Use Supabase MFA `challengeAndVerify` or `verifyOtp`
    - Adapt from existing `/api/auth/mfa` factorId/challengeId pattern to accept code + session
    - Return: `{ success: true, access_token, refresh_token, expires_in, user }`
    - _Bug_Condition: requiredAPIEndpointMissing("/api/auth/verify-mfa")_
    - _Expected_Behavior: Endpoint verifies MFA code and returns session tokens_
    - _Preservation: Existing `POST /api/auth/mfa` (factorId/challengeId) remains unchanged_
    - _Requirements: 2.12, 3.1_

  - [x] 9.6 Create `app/api/auth/me/route.ts`
    - `GET /api/auth/me` - Get current user profile from middleware headers + Prisma
    - `PATCH /api/auth/me` - Update profile (name, email with verification, password with currentPassword)
    - `DELETE /api/auth/me` - Deactivate account (soft-delete in Prisma, sign out from Supabase)
    - Return formats: GET returns `{ fullName, firstName, lastName, email, roles, username, phone }`, PATCH returns `{ success, message, requiresVerification? }`, DELETE returns `{ success, message }`
    - _Bug_Condition: requiredAPIEndpointMissing("/api/auth/me")_
    - _Expected_Behavior: Full user profile CRUD for settings page_
    - _Preservation: No existing endpoints modified_
    - _Requirements: 2.6, 2.12, 3.1_

  - [x] 9.7 Create `app/api/auth/verify-user-update/route.ts`
    - `POST /api/auth/verify-user-update`
    - Accept: `{ code, type }` (type = 'email_change')
    - Use Supabase `verifyOtp` for email change confirmation
    - Return: `{ success: true, message: "Email updated successfully" }`
    - _Bug_Condition: requiredAPIEndpointMissing("/api/auth/verify-user-update")_
    - _Expected_Behavior: Endpoint confirms email change after verification code_
    - _Preservation: No existing endpoints modified_
    - _Requirements: 2.12, 3.1_

  - [x] 9.8 Create `app/api/auth/refresh/route.ts`
    - `POST /api/auth/refresh`
    - Accept: `{ refreshToken }` (or use cookie-based session)
    - Use Supabase `refreshSession`
    - Return: `{ access_token, refresh_token, expires_in }`
    - Used by SessionTracker component for automatic token refresh
    - _Bug_Condition: requiredAPIEndpointMissing("/api/auth/refresh")_
    - _Expected_Behavior: Endpoint refreshes session tokens_
    - _Preservation: No existing endpoints modified; cookie-based session mechanism unchanged_
    - _Requirements: 2.12, 3.1, 3.4_

- [x] 10. Create missing user management API endpoints

  - [x] 10.1 Create `app/api/users/list/route.ts`
    - `GET /api/users/list`
    - Query params: `?page=1&limit=10&username=` for filtering/pagination
    - Use Prisma to query users with pagination (skip/take)
    - Return: `{ data: [...users], total: number, page: number, limit: number }`
    - Each user: `{ id, username, email, firstName, lastName, fullName, role, schoolId, schoolName, isActive, createdAt }`
    - _Bug_Condition: requiredAPIEndpointMissing("/api/users/list")_
    - _Expected_Behavior: Paginated user list with filtering for DataGrid_
    - _Preservation: Existing `/api/users/*` routes unchanged_
    - _Requirements: 2.8, 3.1_

  - [x] 10.2 Create `app/api/users/create/route.ts`
    - `POST /api/users/create`
    - Accept: `{ firstName, lastName, email, phone, assignedRole, schoolId }`
    - Use Supabase admin `createUser` to create auth user
    - Use Prisma to create user profile record with role and school association
    - Requires Admin role (check `x-user-role` header)
    - Return: `{ success: true, user: { id, email, role, ... } }`
    - _Bug_Condition: requiredAPIEndpointMissing("/api/users/create")_
    - _Expected_Behavior: Admin can create users with role and school assignment_
    - _Preservation: Existing `/api/users/*` routes unchanged_
    - _Requirements: 2.8, 3.1, 3.5_

  - [x] 10.3 Create `app/api/users/me/route.ts`
    - `GET /api/users/me`
    - Extract user from middleware headers (`x-user-id`)
    - Fetch user with school info from Prisma (join with school table)
    - Return: `{ id, email, firstName, lastName, fullName, role, school: { id, name }, phone, isActive }`
    - _Bug_Condition: requiredAPIEndpointMissing("/api/users/me")_
    - _Expected_Behavior: Current user profile with school association_
    - _Preservation: Existing `/api/users/*` routes unchanged_
    - _Requirements: 2.8, 3.1_

  - [x] 10.4 Create `app/api/schools/route.ts`
    - `GET /api/schools`
    - Fetch all schools from Prisma
    - Return: `{ data: [{ id, name, address, ... }] }`
    - Used by CreateUserModal dropdown for school selection
    - _Bug_Condition: requiredAPIEndpointMissing("/api/schools")_
    - _Expected_Behavior: School list for dropdown population_
    - _Preservation: No existing endpoints modified_
    - _Requirements: 2.8, 3.1_

- [x] 11. Fix implementation verification

  - [x] 11.1 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Pages Render With MUI/Tailwind Brand UI and Missing Pages/Endpoints Exist
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (MUI components, Tailwind classes, brand theme, missing pages exist, API endpoints respond)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed - pages render MUI with brand theme, missing pages created, API endpoints functional)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12_

  - [x] 11.2 Verify preservation tests still pass
    - **Property 2: Preservation** - Backend API Routes and Auth Infrastructure Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions - all existing API routes, middleware, and auth infrastructure unchanged)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 12. Checkpoint - Ensure all tests pass
  - Run full test suite (`vitest --run`) to verify all property tests pass
  - Run `next build` to verify no TypeScript errors or build failures
  - Ensure exploration test (Property 1) now passes after implementation
  - Ensure preservation tests (Property 2) still pass after implementation
  - Verify all new pages render without errors
  - Verify all new API endpoints respond with expected formats
  - Ask the user if questions arise
