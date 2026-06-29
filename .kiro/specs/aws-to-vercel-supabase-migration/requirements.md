# Requirements Document

## Introduction

This document defines the requirements for consolidating seven separate AWS-based codebases (The Circular Classroom / EcoTrack platform) into a single unified Next.js application deployed on Vercel with Supabase as the backend platform. The existing system manages school uniform donations, inventory tracking, analytics, user management, and CSV-based bulk donation processing. The migration replaces AWS Cognito with Supabase Auth, AWS Lambda/ECS backends with Vercel API Routes/Server Actions, AWS S3 with Supabase Storage, AWS SES/SNS with Supabase Edge Functions or third-party email services, and consolidates PostgreSQL access through Supabase's managed Postgres instance.

## Glossary

- **Unified_Application**: The single Next.js monorepo that consolidates all seven existing codebases into one deployable unit on Vercel
- **Supabase_Auth**: The Supabase authentication service replacing AWS Cognito for user signup, login, MFA, password management, and role-based access control
- **Supabase_Storage**: The Supabase file storage service replacing AWS S3 for CSV uploads and image hosting
- **Supabase_Database**: The Supabase managed PostgreSQL instance replacing the existing AWS-hosted PostgreSQL database
- **Vercel_API_Routes**: The Next.js API route handlers deployed on Vercel's serverless infrastructure, replacing AWS Lambda functions and ECS containers
- **Edge_Functions**: Supabase Edge Functions used for background processing tasks such as CSV validation and notification dispatch
- **Role_Based_Access**: The authorization system using Supabase Auth roles (Admin, SchoolStaff, PsgVolunteer, Parent) to control access to features
- **CSV_Processing_Pipeline**: The file upload, validation, approval, and database insertion workflow for bulk donation data
- **Inventory_Balance**: The computed stock levels of donated items tracked by item type, size, status, and storage location
- **Donation_Drive**: A time-bound collection event at a school during which donations are received
- **Transaction**: A record of inventory movement (donation in, transfer, status change, sale, repurposing, or disposal)

## Requirements

### Requirement 1: Unified Project Structure

**User Story:** As a developer, I want all application code consolidated into a single Next.js monorepo, so that I can develop, test, and deploy the entire platform from one codebase.

#### Acceptance Criteria

1. THE Unified_Application SHALL use the Next.js App Router with a single `package.json` at the root level
2. THE Unified_Application SHALL organize backend logic from all existing backend services (analytics, inventory, user management, CSV processing, and authentication) into Vercel_API_Routes under the `/app/api/` directory
3. THE Unified_Application SHALL consolidate the two existing frontend applications (main frontend and auth frontend) into a single Next.js application with shared layouts and components
4. THE Unified_Application SHALL use a single Prisma schema file that represents the complete data model from all existing backends
5. WHEN a production build is executed via the Next.js build command, THE Unified_Application SHALL complete the build without errors and produce a deployable output compatible with the Vercel platform

### Requirement 2: Authentication Migration

**User Story:** As a user, I want to sign up, log in, and manage my account using Supabase Auth, so that the platform no longer depends on AWS Cognito.

#### Acceptance Criteria

1. THE Supabase_Auth SHALL support email and password based user registration with email confirmation, requiring a minimum password length of 8 characters
2. THE Supabase_Auth SHALL support user login returning access tokens and refresh tokens
3. THE Supabase_Auth SHALL support software token MFA verification during login
4. WHEN a user requests a password reset, THE Supabase_Auth SHALL send a reset link to the registered email address
5. WHEN a user session expires, THE Supabase_Auth SHALL support silent token refresh using the stored refresh token
6. THE Supabase_Auth SHALL support user logout by invalidating the current session
7. THE Supabase_Auth SHALL store user profile attributes (first name, last name, full name, phone number, email) in user metadata, enforcing a maximum length of 100 characters for name fields and 20 characters for phone number
8. WHEN a new user confirms their registration, THE Unified_Application SHALL assign the default role (Parent) to the user
9. IF a user submits invalid credentials during login, THEN THE Supabase_Auth SHALL reject the request with an error message indicating authentication failure without revealing whether the email or password was incorrect
10. IF a user attempts to register with an email address that is already registered, THEN THE Supabase_Auth SHALL reject the registration with an error message indicating the email is unavailable
11. IF a user provides an invalid or expired MFA code during login, THEN THE Supabase_Auth SHALL reject the login attempt and allow the user to retry up to 5 consecutive times before temporarily locking MFA verification for 15 minutes

### Requirement 3: Role-Based Access Control

**User Story:** As an administrator, I want the system to enforce role-based permissions, so that users can only access features appropriate to their role.

#### Acceptance Criteria

1. THE Supabase_Auth SHALL store the user role as one of exactly four values (Admin, SchoolStaff, PsgVolunteer, Parent) in the JWT custom claims
2. THE Unified_Application SHALL validate the user role from the Supabase Auth JWT on every protected API request, where protected API requests are all endpoints except health check, login, registration, and password reset
3. IF a request to a protected endpoint contains no token, an expired token, or a token with an invalid signature, THEN THE Unified_Application SHALL return a 401 Unauthorized response without processing the request
4. IF a non-Admin user accesses user management endpoints, THEN THE Unified_Application SHALL return a 403 Forbidden response
5. WHEN an Admin user accesses user management endpoints, THE Unified_Application SHALL allow the request
6. THE Unified_Application SHALL enforce a role hierarchy where Admin can access all endpoints, SchoolStaff can access inventory and CSV processing endpoints, PsgVolunteer can access collection and donation drive endpoints, and Parent can access only their own profile and donation history endpoints
7. WHEN an Admin changes a user role, THE Unified_Application SHALL validate that the target role is one of the four supported values and update the role in both Supabase Auth metadata and the users database table within a single operation, rolling back both changes if either update fails

### Requirement 4: User Management

**User Story:** As an administrator, I want to create, list, update, and deactivate user accounts, so that I can manage platform access.

#### Acceptance Criteria

1. WHEN an Admin creates a new user providing email, role, and optionally schoolId, THE Unified_Application SHALL create the user in Supabase_Auth with a system-generated temporary password (minimum 12 characters) and create a corresponding record in Supabase_Database with isActive set to true
2. WHEN an Admin lists users, THE Unified_Application SHALL return paginated results with a default page size of 20 and a maximum page size of 100, with optional case-insensitive partial-match email search filtering
3. WHEN an Admin updates a user, THE Unified_Application SHALL update the specified fields (firstName, lastName, fullName, phoneNumber, role, schoolId) in both the Supabase_Auth profile metadata and the Supabase_Database user record
4. WHEN an Admin deactivates a user, THE Unified_Application SHALL disable the user account in Supabase_Auth and set isActive to false in Supabase_Database
5. WHEN an Admin deletes a user, THE Unified_Application SHALL remove the user from Supabase_Auth and delete the corresponding Supabase_Database record
6. WHEN an Admin invokes the user sync endpoint, THE Unified_Application SHALL compare all Supabase_Auth users against Supabase_Database user records and create missing database records for any Auth user without a corresponding database entry
7. IF an Admin attempts to create a user with an email that already exists in Supabase_Auth or Supabase_Database, THEN THE Unified_Application SHALL reject the request with an error message indicating the email is already in use
8. IF an Admin attempts to update, deactivate, or delete a user that does not exist, THEN THE Unified_Application SHALL return an error message indicating the user was not found

### Requirement 5: Database Migration

**User Story:** As a developer, I want all application data stored in Supabase's managed PostgreSQL, so that the platform uses a single database with built-in connection pooling and Row Level Security.

#### Acceptance Criteria

1. THE Supabase_Database SHALL contain all tables from the existing Prisma schema (schools, users, donation_drives, transactions, item_types, inventory_balance, colours, patterns, materials, size_categories, size_options, categories, tags, products, product_types, styles, product_styles, product_recipes, recipe_ingredients, school_partnerships, brand_suppliers, item_type_tags)
2. THE Unified_Application SHALL use Prisma ORM to interact with Supabase_Database
3. THE Supabase_Database SHALL enforce Row Level Security policies where Admin can read and write all rows, SchoolStaff can read and write rows belonging to their assigned school, PsgVolunteer can read rows belonging to their assigned school, and Parent can read only their own user record and transaction history
4. WHEN migrating existing data, THE Unified_Application SHALL preserve all existing records, relationships, and foreign key constraints, verifiable by matching record counts per table and passing referential integrity checks post-migration
5. THE Supabase_Database SHALL replace the `cognito_sub` column with a `supabase_auth_id` column storing the Supabase Auth user UUID while preserving the integer primary key for all existing foreign key references
6. THE Supabase_Database SHALL connect via Supabase connection pooling (PgBouncer on port 6543) for application queries to support concurrent serverless function connections

### Requirement 6: File Storage Migration

**User Story:** As a user, I want to upload CSV files and images using Supabase Storage, so that file management no longer depends on AWS S3.

#### Acceptance Criteria

1. THE Supabase_Storage SHALL provide a `donations` bucket with folder structure: `pre-processing/`, `validated/`, `failed/`, and `processed/`
2. WHEN a user uploads a CSV or Excel file (.csv, .xls, .xlsx), THE Unified_Application SHALL store the file in the `donations/pre-processing/` folder of Supabase_Storage with a unique filename composed of the original filename, uploader user ID, and a timestamp
3. THE Supabase_Storage SHALL provide an `images` bucket for item type photos and school logos
4. THE Supabase_Storage SHALL enforce access policies requiring authentication for both upload and download on the `donations` bucket, and requiring authentication for upload but allowing public read access on the `images` bucket
5. IF a file uploaded to the `donations` bucket exceeds 10 megabytes, THEN THE Unified_Application SHALL reject the upload and display an error message indicating the maximum allowed size and the actual file size
6. IF a file uploaded to the `images` bucket exceeds 5 megabytes, THEN THE Unified_Application SHALL reject the upload and display an error message indicating the maximum allowed size and the actual file size
7. IF a user attempts to upload a file with an extension other than .csv, .xls, or .xlsx to the `donations` bucket, THEN THE Unified_Application SHALL reject the upload and display an error message indicating the accepted file formats

### Requirement 7: CSV Processing Pipeline

**User Story:** As a school staff member, I want to upload donation CSV files that are validated and processed into inventory records, so that bulk donations can be recorded efficiently.

#### Acceptance Criteria

1. WHEN a CSV file is uploaded to the pre-processing folder, THE Unified_Application SHALL validate that each row contains all required fields (item_type_id, size_name, user_id, school_id, donation_drive_id, to_stored_at, quantity, to_status) and validate each field against the database (user existence and active status, school existence and cooperating status, donation drive validity and active date range, donation drive belonging to the referenced school, item type existence, size option existence for the item type, colour existence)
2. WHEN a CSV row references a user who is not active, THE Unified_Application SHALL mark that row as invalid with an error message indicating the user is not active
3. WHEN a CSV row references a donation drive that is not currently active based on its start and end dates, THE Unified_Application SHALL mark that row as invalid with an error message indicating the drive is not active and its valid date range
4. WHEN a CSV row specifies storage location "school" with status "for repurposing", THE Unified_Application SHALL mark that row as invalid with an error message indicating this combination is not permitted
5. IF all rows pass validation, THEN THE Unified_Application SHALL move the file to the `validated/` folder and send an email notification to the uploader confirming the file is awaiting admin approval
6. IF any rows fail validation, THEN THE Unified_Application SHALL move the file to the `failed/` folder and send an email notification to the uploader listing validation errors per row for up to 50 failed rows
7. WHEN an Admin approves a validated CSV file, THE Unified_Application SHALL create Transaction records and update Inventory_Balance records in Supabase_Database within a single database transaction, and move the file to the `processed/` folder upon success
8. THE Unified_Application SHALL support both CSV and Excel (xlsx/xls) file formats for donation uploads
9. IF the uploaded file contains no data rows or contains only empty rows after the header, THEN THE Unified_Application SHALL reject the file with an error message indicating the file contains no valid data rows
10. IF the database write fails during approved file processing, THEN THE Unified_Application SHALL roll back all Transaction and Inventory_Balance changes for that file, retain the file in the `validated/` folder, and send an email notification to the approver indicating the processing failure

### Requirement 8: Inventory Management API

**User Story:** As a school staff member, I want to manage inventory items, donation drives, and transactions through the platform, so that I can track donated uniform items.

#### Acceptance Criteria

1. THE Unified_Application SHALL provide CRUD API endpoints for item types, including associations with school, category, colour, pattern, material, and size category, where deletion is rejected with an error indication if the item type has associated transactions or inventory balances
2. THE Unified_Application SHALL provide CRUD API endpoints for donation drives scoped to a school, supporting filtering by active status and pagination of results
3. WHEN a user submits a transaction (donation in, transfer, status change, sale, repurposing, or disposal), THE Unified_Application SHALL validate the state transition against the allowed status flow (ForSale, ForRepurpose as active statuses; Sold, Repurposed, Disposed as terminal statuses), create the transaction record, and update the corresponding inventory balances atomically within a single database transaction
4. THE Unified_Application SHALL provide API endpoints to manage configuration entities: categories, colours, patterns, materials, brands, sizes, and tags
5. THE Unified_Application SHALL provide an inventory overview endpoint returning current stock levels with quantity greater than zero, grouped by item type, size, status, and storage location
6. IF a transaction would reduce an inventory balance below zero, THEN THE Unified_Application SHALL reject the request with an error indication specifying the item type, size, current quantity, and requested quantity
7. IF a transaction specifies an invalid status transition (including transitioning from a terminal status), THEN THE Unified_Application SHALL reject the request with an error indication describing the invalid transition

### Requirement 9: Analytics and Reporting

**User Story:** As an administrator, I want to view analytics dashboards and generate reports, so that I can understand donation volumes, inventory distribution, and school performance.

#### Acceptance Criteria

1. THE Unified_Application SHALL provide API endpoints for collection analytics including: donations received per school, per category, and per donation drive, filterable by year and optional start month (1-12) and end month (1-12)
2. THE Unified_Application SHALL provide API endpoints for assembly analytics including: repurposed product projections based on current stock and recipe ingredient requirements, and assembly plan calculations given target quantities
3. THE Unified_Application SHALL provide API endpoints for school-level overview statistics including: total inventory item count, item counts grouped by status (ForSale, ForRepurpose, Disposed, GeneralOffice), and item counts grouped by storage location
4. THE Unified_Application SHALL provide a report generation endpoint that produces PDF reports containing: current inventory totals, inventory breakdown by school and by category, yearly donation trends, school performance rankings, and sustainability metrics (weight diverted from landfill) for a specified year
5. THE Unified_Application SHALL provide an overview dashboard endpoint aggregating platform-wide statistics including: total inventory count with weight estimate, inventory distribution by school, inventory distribution by category, yearly donation and disposal trend, donation drive participation rates, and repurposing material availability by colour
6. IF a collection analytics or overview request includes an invalid filter parameter (non-integer year, month outside 1-12, or startMonth greater than endMonth), THEN THE Unified_Application SHALL return a 400 response with an error message indicating the validation failure

### Requirement 10: Notification Service Migration

**User Story:** As a user, I want to receive email notifications about CSV processing results and system events, so that I am informed without depending on AWS SES and SNS.

#### Acceptance Criteria

1. WHEN a CSV file passes validation, THE Unified_Application SHALL send an email to the uploader within 60 seconds that includes the file name and confirms the file is awaiting approval
2. WHEN a CSV file fails validation, THE Unified_Application SHALL send an email to the uploader within 60 seconds that includes the file name, total row count, number of failed rows, and up to 50 row-level error descriptions
3. WHEN a CSV file is approved and processed, THE Unified_Application SHALL send a confirmation email to both the uploader and the approver that includes the file name and the total number of records processed
4. THE Unified_Application SHALL use a Vercel-compatible email service (Resend, SendGrid, or Supabase Edge Functions with SMTP) to replace AWS SES
5. IF the email service fails to respond within 10 seconds or returns an error, THEN THE Unified_Application SHALL retry the send once, and if the retry also fails, log the notification failure including the recipient address and file name, and continue processing without blocking the operation
6. THE Unified_Application SHALL resolve recipient email addresses from the user profile stored in Supabase_Auth metadata

### Requirement 11: Image Upload and Management

**User Story:** As a school staff member, I want to upload images for item types and school logos, so that inventory items and schools have visual identifiers.

#### Acceptance Criteria

1. WHEN a user uploads an item type image, THE Unified_Application SHALL store the image in the Supabase_Storage `images` bucket and save the public URL in the item type record
2. WHEN a user uploads a school logo, THE Unified_Application SHALL store the image in the Supabase_Storage `images` bucket and save the public URL in the school record
3. THE Supabase_Storage SHALL serve images via public URLs accessible without authentication
4. WHEN a user uploads an image, THE Unified_Application SHALL validate the file is in an accepted format (PNG, JPG, JPEG, WebP) and does not exceed 5 megabytes in size
5. IF an uploaded image fails format or size validation, THEN THE Unified_Application SHALL reject the upload and return an error message indicating which validation check failed (invalid format or file too large)
6. WHEN a user uploads a new image for an item type or school that already has an image, THE Unified_Application SHALL replace the existing image in Supabase_Storage and update the stored URL in the corresponding record

### Requirement 12: Environment and Deployment Configuration

**User Story:** As a developer, I want the application properly configured for Vercel deployment with Supabase integration, so that CI/CD and environment management are streamlined.

#### Acceptance Criteria

1. THE Unified_Application SHALL read all service configuration (Supabase URL, Supabase anon key, Supabase service role key, database URL, email service credentials) exclusively from Vercel environment variables with no hardcoded values in the source code
2. IF any required environment variable (Supabase URL, Supabase anon key, Supabase service role key, database URL) is missing at application startup, THEN THE Unified_Application SHALL fail to start and log an error message indicating which variable is missing
3. THE Unified_Application SHALL not contain any AWS SDK dependencies (including @aws-sdk/* packages and aws-jwt-verify) in the production `package.json` dependencies or build output
4. THE Unified_Application SHALL provide an idempotent database migration script using Prisma Migrate that creates the complete schema (all tables defined in Requirement 5) on Supabase_Database and can be re-run without data loss
5. THE Unified_Application SHALL support preview deployments on Vercel by using separate environment variable sets per deployment environment, ensuring preview branches connect to a staging Supabase project isolated from production data
6. WHEN the application is deployed, THE Unified_Application SHALL expose a health check endpoint that verifies database connectivity to Supabase_Database and responds with HTTP 200 status within 5 seconds when all dependencies are reachable
7. IF the health check endpoint cannot connect to Supabase_Database, THEN THE Unified_Application SHALL respond with HTTP 503 status and a response body indicating the unavailable dependency
