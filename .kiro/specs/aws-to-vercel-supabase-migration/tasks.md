# Implementation Plan: AWS to Vercel/Supabase Migration

## Overview

This plan consolidates seven AWS-based codebases into a single Next.js 16 monorepo deployed on Vercel with Supabase as the backend. Tasks are ordered to build foundational infrastructure first (project structure, auth, database), then layer on feature modules (CSV, inventory, analytics), and finish with integration wiring and deployment configuration.

## Tasks

- [x] 1. Set up unified project structure and core configuration
  - [x] 1.1 Initialize Next.js App Router project with directory structure
    - Create the root `app/` directory structure with route groups: `(auth)/`, `(dashboard)/`, and `api/` subdirectories matching the design's project structure
    - Create the `lib/` directory with subdirectories: `supabase/`, `prisma/`, `auth/`, `email/`, `csv/`, `inventory/`, `analytics/`, `reports/`
    - Set up `package.json` with core dependencies: next, react, @supabase/ssr, @supabase/supabase-js, @prisma/client, resend, fast-check (dev), vitest (dev)
    - Create `next.config.ts`, `vercel.json`, and `.env.local.example`
    - _Requirements: 1.1, 1.2, 1.3, 12.1_

  - [x] 1.2 Implement environment variable validation module
    - Create `lib/env.ts` that validates all required environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL) at startup
    - Fail with a clear error message naming any missing variable
    - Import the validation in the root layout to ensure it runs on startup
    - _Requirements: 12.1, 12.2_

  - [x] 1.3 Write property test for environment variable validation
    - **Property 22: Environment variable startup validation**
    - **Validates: Requirements 12.2**

  - [x] 1.4 Create unified Prisma schema
    - Create `prisma/schema.prisma` with the complete data model from all existing backends
    - Replace `cognito_sub` with `supabase_auth_id` (UUID type, unique)
    - Configure datasource with `url` (pooled, port 6543) and `directUrl` (direct, port 5432)
    - Include all tables: users, schools, donation_drives, transactions, item_types, inventory_balance, colours, patterns, materials, size_categories, size_options, categories, tags, products, product_types, styles, product_styles, product_recipes, recipe_ingredients, school_partnerships, brand_suppliers, item_type_tags
    - _Requirements: 1.4, 5.1, 5.2, 5.5, 5.6_

  - [x] 1.5 Create Prisma client singleton
    - Create `lib/prisma/client.ts` with a singleton pattern suitable for serverless (prevents connection exhaustion in dev/hot reload)
    - _Requirements: 5.2, 5.6_

- [x] 2. Implement authentication module
  - [x] 2.1 Create Supabase client factories
    - Implement `lib/supabase/client.ts` (browser client)
    - Implement `lib/supabase/server.ts` (server client with cookie handling)
    - Implement `lib/supabase/admin.ts` (service-role client for admin operations)
    - _Requirements: 2.1, 2.2_

  - [x] 2.2 Implement role authorization utilities
    - Create `lib/auth/roles.ts` with UserRole type, ROLE_HIERARCHY, RoutePermission interface, and `hasPermission` function
    - Implement role hierarchy: Admin (all), SchoolStaff (inventory + CSV), PsgVolunteer (collection + drives), Parent (own profile + history)
    - Implement input validation: role values must be exactly one of Admin, SchoolStaff, PsgVolunteer, Parent
    - _Requirements: 3.1, 3.4, 3.5, 3.6_

  - [x] 2.3 Write property tests for role validation and authorization
    - **Property 3: Role value validation**
    - **Property 5: Role hierarchy authorization**
    - **Validates: Requirements 3.1, 3.4, 3.6, 3.7**

  - [x] 2.4 Implement Next.js middleware for JWT validation
    - Create `middleware.ts` at project root
    - Define PUBLIC_PATHS: /login, /register, /reset-password, /api/health
    - Validate JWT using Supabase server client's `getUser()`
    - Return 401 for API requests without valid auth; redirect to /login for page requests
    - Attach `x-user-id` and `x-user-role` headers to forwarded requests
    - _Requirements: 3.2, 3.3, 4 (JWT enforcement)_

  - [x] 2.5 Write property test for JWT authentication enforcement
    - **Property 4: JWT authentication enforcement**
    - **Validates: Requirements 3.2, 3.3**

  - [x] 2.6 Implement auth API routes
    - Create `app/api/auth/callback/route.ts` for OAuth/email confirmation callback
    - Create `app/api/auth/session/route.ts` for session refresh
    - Implement login flow returning access + refresh tokens
    - Implement registration with email confirmation, minimum 8 character password, default Parent role assignment
    - Implement MFA verification with 5-attempt lockout (15 min)
    - Implement password reset flow
    - Implement logout (session invalidation)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8, 2.9, 2.10, 2.11_

  - [x] 2.7 Write property tests for password and profile validation
    - **Property 1: Password validation enforces minimum length**
    - **Property 2: Profile field length validation**
    - **Validates: Requirements 2.1, 2.7**

- [x] 3. Checkpoint - Ensure auth module tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement user management API
  - [x] 4.1 Create user management API routes
    - Create `app/api/users/route.ts` with GET (list) and POST (create) handlers
    - Create `app/api/users/[id]/route.ts` with GET, PATCH, DELETE handlers
    - Create `app/api/users/[id]/deactivate/route.ts` for deactivation
    - Create `app/api/users/sync/route.ts` for auth-to-db sync
    - Enforce Admin-only access on all user management endpoints (return 403 for non-Admin)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 3.4, 3.5_

  - [x] 4.2 Implement user CRUD business logic
    - Create user: generate temp password (min 12 chars), create in Supabase Auth + DB record with isActive=true
    - List users: paginated (default 20, max 100), optional case-insensitive email search
    - Update user: sync fields to both Supabase Auth metadata and DB
    - Deactivate: disable in Auth + set isActive=false in DB
    - Delete: remove from Auth + delete DB record
    - Role change: validate target role, update Auth metadata + DB in single operation with rollback
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 3.7_

  - [x] 4.3 Write property test for pagination bounds
    - **Property 6: Pagination bounds clamping**
    - **Validates: Requirements 4.2**

  - [x] 4.4 Write unit tests for user management edge cases
    - Test duplicate email rejection, user not found errors, user sync logic
    - _Requirements: 4.6, 4.7, 4.8_

- [x] 5. Implement file storage and upload module
  - [x] 5.1 Implement file validation utilities
    - Create `lib/storage/validation.ts` with file size validation (10MB donations, 5MB images) and file type validation (csv/xls/xlsx for donations, png/jpg/jpeg/webp for images)
    - Return error messages including max allowed size and actual size
    - _Requirements: 6.5, 6.6, 6.7, 11.4, 11.5_

  - [x] 5.2 Write property tests for file validation
    - **Property 8: File size validation**
    - **Property 9: File type validation**
    - **Validates: Requirements 6.5, 6.6, 6.7, 11.4, 11.5**

  - [x] 5.3 Implement unique filename generation
    - Create utility that combines original filename stem, user ID, and timestamp into a unique filename
    - _Requirements: 6.2_

  - [x] 5.4 Write property test for filename uniqueness
    - **Property 7: Unique filename generation**
    - **Validates: Requirements 6.2**

  - [x] 5.5 Implement CSV upload API route
    - Create `app/api/csv/upload/route.ts` that validates file type and size, generates unique filename, uploads to Supabase Storage `donations/pre-processing/` folder
    - _Requirements: 6.1, 6.2, 6.5, 6.7, 7.8_

  - [x] 5.6 Implement image upload API routes
    - Create `app/api/storage/images/route.ts` for image uploads
    - Validate format (PNG, JPG, JPEG, WebP) and size (max 5MB)
    - Upload to Supabase Storage `images` bucket
    - Save public URL to item type or school record
    - Handle replacement of existing images
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [x] 6. Implement CSV processing pipeline
  - [x] 6.1 Implement CSV/Excel parser
    - Create `lib/csv/parser.ts` that handles both CSV and Excel (xlsx/xls) formats
    - Return ParseResult with headers, typed rows, and total count
    - Handle empty files (no data rows after header) with appropriate error
    - _Requirements: 7.8, 7.9_

  - [x] 6.2 Write property test for CSV/Excel parsing equivalence
    - **Property 15: CSV and Excel parsing equivalence**
    - **Validates: Requirements 7.8**

  - [x] 6.3 Implement CSV row validator
    - Create `lib/csv/validator.ts` with `validateDonationCsv` function
    - Validate required fields present: item_type_id, size_name, user_id, school_id, donation_drive_id, to_stored_at, quantity, to_status
    - Validate against database: user active, school cooperating, drive active date range, drive belongs to school, item type exists, size option exists for item type, colour exists
    - Reject "school" + "for_repurposing" combination
    - Cap error reporting at 50 entries
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 6.4 Write property tests for CSV validation rules
    - **Property 10: CSV required fields validation**
    - **Property 11: CSV inactive user rejection**
    - **Property 12: CSV inactive drive rejection**
    - **Property 13: CSV forbidden storage/status combination**
    - **Property 14: Validation error reporting cap**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.6**

  - [x] 6.5 Implement CSV approval processor
    - Create `lib/csv/processor.ts` with `processApprovedCsv` function
    - Create Transaction records and update Inventory_Balance atomically in a single Prisma $transaction
    - Move file to `processed/` folder on success
    - Roll back all changes on failure, retain file in `validated/`, notify approver
    - _Requirements: 7.7, 7.10_

  - [x] 6.6 Implement CSV validation and approval API routes
    - Create `app/api/csv/validate/route.ts` — triggered after upload, runs validator, moves to validated/ or failed/ folder
    - Create `app/api/csv/approve/route.ts` — Admin approves a validated file, triggers processor
    - _Requirements: 7.5, 7.6, 7.7, 7.10_

- [x] 7. Checkpoint - Ensure CSV pipeline tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement inventory management module
  - [x] 8.1 Implement transaction state machine
    - Create `lib/inventory/transactions.ts` with status types, terminal statuses, allowed transitions map, and `isValidTransition` function
    - Terminal statuses: Sold, Repurposed, Disposed (no outgoing transitions)
    - Active statuses: ForSale, ForRepurpose, GeneralOffice
    - _Requirements: 8.3, 8.7_

  - [x] 8.2 Write property test for transaction state machine
    - **Property 17: Transaction state machine**
    - **Validates: Requirements 8.3, 8.7**

  - [x] 8.3 Implement inventory balance manager
    - Create `lib/inventory/balance.ts` with `updateInventoryBalance` function
    - Validate that transactions don't reduce balance below zero
    - Return error with itemType, size, currentQuantity, requestedQuantity on underflow
    - _Requirements: 8.3, 8.5, 8.6_

  - [x] 8.4 Write property tests for inventory balance constraints
    - **Property 18: Inventory overview positive quantity invariant**
    - **Property 19: Balance non-negative constraint**
    - **Validates: Requirements 8.5, 8.6**

  - [x] 8.5 Implement inventory API routes
    - Create `app/api/inventory/item-types/route.ts` — CRUD for item types with deletion guard (reject if has transactions or balances)
    - Create `app/api/inventory/item-types/[id]/route.ts` — GET, PATCH, DELETE
    - Create `app/api/inventory/transactions/route.ts` — create transaction with state validation + atomic balance update
    - Create `app/api/inventory/balance/route.ts` — overview endpoint returning items with quantity > 0
    - Create `app/api/donations/drives/route.ts` — CRUD for donation drives scoped to school, with active filter and pagination
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 8.6 Write property test for item type deletion guard
    - **Property 16: Item type deletion guard**
    - **Validates: Requirements 8.1**

  - [x] 8.7 Implement configuration entity API routes
    - Create `app/api/inventory/categories/route.ts`
    - Create `app/api/inventory/colours/route.ts`
    - Create `app/api/inventory/patterns/route.ts`
    - Create `app/api/inventory/materials/route.ts`
    - Create `app/api/inventory/brands/route.ts`
    - Create `app/api/inventory/sizes/route.ts`
    - Create `app/api/inventory/tags/route.ts`
    - _Requirements: 8.4_

- [x] 9. Implement analytics and reporting module
  - [x] 9.1 Implement collection analytics
    - Create `lib/analytics/collection.ts` with `getCollectionAnalytics` function
    - Support filtering by year, startMonth (1-12), endMonth (1-12), schoolId
    - Validate filter parameters (reject invalid year, month outside 1-12, startMonth > endMonth)
    - _Requirements: 9.1, 9.6_

  - [x] 9.2 Implement assembly analytics
    - Create `lib/analytics/assembly.ts` with `getRepurposeProjections` and `calculateAssemblyPlan`
    - Assembly plan must never specify producing more than available stock supports
    - _Requirements: 9.2_

  - [x] 9.3 Write property tests for analytics
    - **Property 20: Assembly plan feasibility**
    - **Property 21: Analytics filter parameter validation**
    - **Validates: Requirements 9.2, 9.6**

  - [x] 9.4 Implement overview and school statistics
    - Create `lib/analytics/overview.ts` with platform-wide and school-level statistics functions
    - School overview: total inventory, items by status, items by storage location
    - Platform overview: total inventory with weight, distribution by school and category, yearly trends, drive participation, repurposing material availability by colour
    - _Requirements: 9.3, 9.5_

  - [x] 9.5 Implement analytics and reports API routes
    - Create `app/api/analytics/collection/route.ts`
    - Create `app/api/analytics/assembly/route.ts`
    - Create `app/api/analytics/overview/route.ts`
    - Create `app/api/reports/route.ts` — PDF generation with PDFKit (inventory totals, breakdown, trends, rankings, sustainability metrics)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 10. Implement email notification service
  - [x] 10.1 Implement Resend email client and templates
    - Create `lib/email/resend.ts` with Resend client initialization
    - Implement `sendCsvValidationEmail` (passed/failed with file name, row count, up to 50 errors)
    - Implement `sendCsvProcessedEmail` (confirmation to uploader + approver)
    - Implement retry logic: retry once on failure, log and continue if retry fails
    - Resolve recipient email from Supabase Auth user metadata
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 10.2 Write unit tests for email notification service
    - Test retry behavior on failure
    - Test error logging when both attempts fail
    - Test email content includes correct file name and record counts
    - _Requirements: 10.5_

- [x] 11. Checkpoint - Ensure all module tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement database security and deployment configuration
  - [x] 12.1 Create Row Level Security SQL migration
    - Create SQL migration file with RLS policies for all tables
    - Admin: full access to all rows
    - SchoolStaff: read/write rows belonging to their school
    - PsgVolunteer: read rows belonging to their school
    - Parent: read own user record and transaction history only
    - _Requirements: 5.3_

  - [x] 12.2 Create Prisma migration scripts
    - Generate idempotent Prisma Migrate migration that creates the complete schema
    - Ensure migration can be re-run without data loss
    - _Requirements: 5.4, 12.4_

  - [x] 12.3 Implement health check endpoint
    - Create `app/api/health/route.ts`
    - Verify database connectivity to Supabase
    - Return HTTP 200 within 5 seconds when all dependencies reachable
    - Return HTTP 503 with unavailable dependency info when DB unreachable
    - _Requirements: 12.6, 12.7_

  - [x] 12.4 Configure Vercel deployment settings
    - Create/update `vercel.json` with environment variable configuration
    - Ensure no AWS SDK dependencies in production package.json
    - Configure preview deployment environment variable sets
    - Create `.env.local.example` documenting all required variables
    - _Requirements: 12.1, 12.3, 12.5_

- [x] 13. Wire frontend consolidation
  - [x] 13.1 Create shared layout and navigation components
    - Create `app/(dashboard)/layout.tsx` with shared navigation
    - Create `app/(auth)/layout.tsx` for auth pages
    - Create `app/layout.tsx` root layout with providers
    - _Requirements: 1.3_

  - [x] 13.2 Create auth pages
    - Create `app/(auth)/login/page.tsx`
    - Create `app/(auth)/register/page.tsx`
    - Create `app/(auth)/reset-password/page.tsx`
    - Wire pages to Supabase Auth client
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 13.3 Create dashboard pages
    - Create `app/(dashboard)/overview/page.tsx`
    - Create `app/(dashboard)/inventory/page.tsx`
    - Create `app/(dashboard)/donations/page.tsx`
    - Create `app/(dashboard)/analytics/page.tsx`
    - Create `app/(dashboard)/csv-upload/page.tsx`
    - Create `app/(dashboard)/users/page.tsx` (Admin only)
    - Create `app/(dashboard)/settings/page.tsx`
    - _Requirements: 1.3_

- [x] 14. Final verification and build
  - [x] 14.1 Verify production build succeeds
    - Run `next build` and ensure it completes without errors
    - Verify no AWS SDK imports remain in source code
    - Verify output is Vercel-compatible
    - _Requirements: 1.5, 12.3_

  - [x] 14.2 Write integration tests for end-to-end flows
    - Test auth flow: register → confirm → login → access protected route
    - Test CSV pipeline: upload → validate → approve → process → verify records
    - Test inventory flow: create item type → create transaction → verify balance
    - _Requirements: 2.1, 2.2, 7.7, 8.3_

- [x] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties defined in the design
- Unit tests validate specific examples and edge cases
- The existing Prisma schema from `tcc-analytics-backend` and `tcc-inventory-backend` should be used as the starting point for the unified schema (they are already identical)
- TypeScript is used throughout as specified in the design (Next.js 16, Vitest, fast-check)
- Resend is the chosen email provider per design decision

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.4"] },
    { "id": 1, "tasks": ["1.2", "1.5", "2.1"] },
    { "id": 2, "tasks": ["1.3", "2.2", "5.1", "5.3"] },
    { "id": 3, "tasks": ["2.3", "2.4", "5.2", "5.4"] },
    { "id": 4, "tasks": ["2.5", "2.6", "5.5", "5.6"] },
    { "id": 5, "tasks": ["2.7", "4.1", "8.1"] },
    { "id": 6, "tasks": ["4.2", "4.3", "8.2", "8.3"] },
    { "id": 7, "tasks": ["4.4", "6.1", "8.4", "8.5"] },
    { "id": 8, "tasks": ["6.2", "6.3", "8.6", "8.7"] },
    { "id": 9, "tasks": ["6.4", "6.5", "9.1", "9.2"] },
    { "id": 10, "tasks": ["6.6", "9.3", "9.4", "10.1"] },
    { "id": 11, "tasks": ["9.5", "10.2", "12.1"] },
    { "id": 12, "tasks": ["12.2", "12.3", "12.4"] },
    { "id": 13, "tasks": ["13.1"] },
    { "id": 14, "tasks": ["13.2", "13.3"] },
    { "id": 15, "tasks": ["14.1", "14.2"] }
  ]
}
```
