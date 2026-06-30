# Bugfix Requirements Document

## Introduction

The migration from AWS/Cognito to Vercel/Supabase did not properly port the frontend. The current `app/` folder contains minimal placeholder pages with inline styles, missing all MUI components, Tailwind CSS styling, brand theming, and rich UI that existed in the legacy frontends (`cognito-frontend/` and `eco-track-frontend/`). The application is visually broken and non-functional from a user experience perspective — pages show plain text or bare HTML forms instead of the styled, component-rich interfaces users expect.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user visits any page in the application THEN the system renders plain text or unstyled inline HTML without MUI components, Tailwind CSS, brand colors (#69aa56), Inter font, or any visual design framework

1.2 WHEN a user visits the root layout (`app/layout.tsx`) THEN the system renders a bare `<body>` with inline `style` attribute and system fonts instead of providing MUI ThemeProvider, CssBaseline, Tailwind globals, and Inter font configuration

1.3 WHEN a user visits the login page (`/login`) THEN the system renders a plain inline-styled form without MUI Paper/TextField/Button components, gradient accent bar, password visibility toggle, email icon adornments, or proper error handling with SnackbarAlert

1.4 WHEN a user visits the registration page (`/register`) THEN the system renders a plain inline-styled form without MUI components, role selection, or proper form validation UI

1.5 WHEN a user visits the reset password page (`/reset-password`) THEN the system renders a plain inline-styled form without MUI styling or proper user feedback components

1.6 WHEN a user visits any dashboard page (inventory, analytics, donations, csv-upload, users, settings, overview) THEN the system renders placeholder text (e.g., "Inventory Page") instead of functional data-driven UI with DataGrid tables, charts, file upload interfaces, and interactive forms

1.7 WHEN a user is authenticated and navigates the dashboard THEN the system renders a plain inline-styled sidebar layout instead of a proper Header with logo, module switcher (Inventory/Analytics tabs), user dropdown menu, NavigationTabs sub-navigation, and Footer with TCC branding

1.8 WHEN a user visits the users management page (`/users`) THEN the system renders placeholder text instead of a DataGrid with server-side pagination, user creation modal, edit drawer, role chips, active status indicators, and delete confirmation dialogs

1.9 WHEN a user visits the analytics pages THEN the system renders placeholder text instead of charts (recharts), summary cards, and data visualization dashboards for collection and assembly metrics

1.10 WHEN a user visits the CSV upload page THEN the system renders placeholder text instead of a file upload interface with drag-and-drop, validation feedback, and approval workflow UI

1.11 WHEN a user visits the donations page THEN the system renders placeholder text instead of a donation drives management interface with cards, progress indicators, and CRUD operations

1.12 WHEN the frontend attempts authentication THEN the system uses a basic form that directly calls Supabase without providing proper UX feedback (loading states, error snackbars, redirect handling, MFA flow support)

### Expected Behavior (Correct)

2.1 WHEN a user visits any page in the application THEN the system SHALL render fully styled pages using MUI components, Tailwind CSS utilities, the green brand theme (#69aa56 primary, #213c2d darker), and Inter font — matching the visual design of the legacy frontends

2.2 WHEN a user visits the root layout THEN the system SHALL provide a MUI ThemeProvider with Inter font typography, CssBaseline for consistent styling, AppRouterCacheProvider for MUI/Next.js integration, Tailwind CSS globals with brand CSS variables, and proper `<html>` / `<body>` structure

2.3 WHEN a user visits the login page THEN the system SHALL render a MUI Paper card with gradient accent bar, email TextField with EmailRounded icon, password TextField with visibility toggle (Visibility/VisibilityOff icons), a green "Sign in" Button, links to register and forgot password, SnackbarAlert for error/success messages, and shall call `POST /api/auth/login` adapting to the new response format (`access_token`, `refresh_token`, `expires_in`, `user`)

2.4 WHEN a user visits the registration page THEN the system SHALL render a styled MUI form with proper fields (email, password, confirm password), role indication, and call `POST /api/auth/register` with appropriate error handling and user feedback

2.5 WHEN a user visits the reset password page THEN the system SHALL render a styled MUI form with email field, call `POST /api/auth/reset-password`, and provide SnackbarAlert feedback on success/failure

2.6 WHEN a user visits any dashboard page THEN the system SHALL render functional, data-driven UI with proper MUI components (DataGrid, Paper, Cards, Typography), loading spinners, error states, and real data fetched from the current API routes

2.7 WHEN a user is authenticated and navigates the dashboard THEN the system SHALL render a Header with TCC logo, module switcher tabs (Inventory/Analytics), user profile dropdown with logout capability, NavigationTabs for sub-section navigation within inventory, and a Footer with TCC branding and social links — all calling the current Supabase-based API routes for session management

2.8 WHEN a user visits the users management page THEN the system SHALL render a MUI DataGrid with server-side pagination calling `GET /api/users`, a "Add User" button opening a CreateUserModal calling `POST /api/users`, an edit Drawer calling `PATCH /api/users/[id]`, delete functionality calling `DELETE /api/users/[id]`, role chips using the new roles (Admin, SchoolStaff, PsgVolunteer, Parent), and active status indicators

2.9 WHEN a user visits the analytics pages THEN the system SHALL render recharts-based visualizations (bar charts, line charts, pie charts), summary stat cards, and data tables fetching from `GET /api/analytics/overview`, `GET /api/analytics/collection`, and `GET /api/analytics/assembly`

2.10 WHEN a user visits the CSV upload page THEN the system SHALL render a file upload interface with drag-and-drop support, validation feedback calling `POST /api/csv/validate`, upload functionality calling `POST /api/csv/upload`, and an approval workflow calling `POST /api/csv/approve`

2.11 WHEN a user visits the donations page THEN the system SHALL render a donation drives management interface with cards/list views fetching from `GET /api/donations/drives`, progress indicators, and appropriate CRUD operations

2.12 WHEN the frontend performs authentication THEN the system SHALL use Supabase client-side auth via `@supabase/ssr` with cookie-based sessions (managed by existing middleware), provide loading states during async operations, display error/success messages via SnackbarAlert, handle redirects after login, and support the MFA verification flow via `POST /api/auth/mfa`

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the backend API routes receive requests THEN the system SHALL CONTINUE TO handle them identically — all existing API route handlers (`/api/auth/*`, `/api/inventory/*`, `/api/analytics/*`, `/api/csv/*`, `/api/donations/*`, `/api/users/*`, `/api/reports`, `/api/storage/*`, `/api/health`) SHALL remain unchanged in behavior and response format

3.2 WHEN the Supabase middleware intercepts requests THEN the system SHALL CONTINUE TO validate JWT tokens via `getUser()`, redirect unauthenticated users to `/login`, return 401 for unauthorized API requests, and attach `x-user-id` and `x-user-role` headers for downstream use

3.3 WHEN a user authenticates via the login API THEN the system SHALL CONTINUE TO return the response format `{ access_token, refresh_token, expires_in, user: { id, email, role } }` from `POST /api/auth/login`

3.4 WHEN the application uses Supabase cookie-based auth THEN the system SHALL CONTINUE TO manage sessions through cookies (not sessionStorage) as established by the `@supabase/ssr` middleware pattern

3.5 WHEN role-based access control is applied THEN the system SHALL CONTINUE TO use the Supabase `app_metadata.role` values (Admin, SchoolStaff, PsgVolunteer, Parent) rather than legacy Cognito group names

3.6 WHEN the application is built and deployed THEN the system SHALL CONTINUE TO use Next.js 15 App Router conventions with the existing `(auth)` and `(dashboard)` route groups, TypeScript (.tsx) file format, and the existing project structure

3.7 WHEN the Prisma client is used for database operations THEN the system SHALL CONTINUE TO function correctly — no changes to database schema, Prisma client usage, or data access patterns in the API layer
