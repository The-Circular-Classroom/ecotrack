# EcoTrack Unified

EcoTrack Unified is the consolidated Vercel + Supabase codebase for the EcoTrack platform. It replaces the older multi-repo AWS Lambda setup with a single Next.js app, a shared Prisma schema, Supabase authentication, and Supabase-backed storage.

## What this app includes

- Next.js App Router frontend and API routes in one deployable project.
- Supabase Auth for browser and server session handling.
- Prisma + PostgreSQL for the canonical application data model.
- CSV upload validation, artifact storage, and approval workflows.
- Unified inventory, analytics, transaction, donation drive, school, and configuration screens.

## Tech Stack

- Next.js 16
- React 19
- Prisma 6
- Supabase Auth and Storage
- PostgreSQL
- `csv-parse` and `xlsx` for spreadsheet ingestion

## Project Structure

- `src/app` - App Router pages and route handlers.
- `src/components` - Shared UI shells and reusable sections.
- `src/lib/data` - Domain data access and workflow helpers.
- `src/lib/supabase` - Browser and server Supabase clients.
- `src/lib/storage` - Supabase Storage helpers.
- `prisma/schema.prisma` - Canonical schema for the unified app.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root with the required values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://user:password@host:5432/database
SUPABASE_STORAGE_BUCKET_NAME=donations
```

`DATABASE_URL` should point to the Supabase Postgres database. `SUPABASE_STORAGE_BUCKET_NAME` is used for CSV artifacts and defaults to `donations` if omitted.

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Run the app locally

```bash
npm run dev
```

## Scripts

- `npm run dev` - Start the development server.
- `npm run build` - Build the production app.
- `npm run start` - Start the production server.
- `npm run lint` - Run ESLint.
- `npm run prisma:generate` - Generate the Prisma client.

## Key Routes

### App Pages

- `/` - Migration landing page and route map.
- `/auth` - Supabase auth entry point.
- `/inventory` - Inventory operations.
- `/analytics` - Analytics hub.
- `/csv` - CSV upload and approval workflow.
- `/transaction` - Transaction ledger.
- `/donation-drives` - Donation drive management.
- `/configuration` - Catalog maintenance.
- `/users` - User management.
- `/settings` - Deployment readiness and environment checks.

### API Routes

- `/api/health` - Health check endpoint.
- `/api/users/*` - User profile and admin user APIs.
- `/api/csv/process-donation-csv` - CSV validation and approval workflow.
- `/api/donation-drive/*` - Donation drive APIs.
- `/api/inventory/*` - Inventory and condition update APIs.
- `/api/analytics/overview/*` - Analytics overview APIs.
- `/api/overview/*` - Higher-level reporting helpers.
- `/api/collection/*` - Collection analytics helpers.
- `/api/assembly/*` - Product and recipe assembly helpers.
- `/api/report/*` - Downloadable report endpoints.

## Authentication Model

This codebase uses Supabase session state instead of the old Cognito lambda flow. The browser auth panel uses Supabase client methods, and the server derives request context from the Supabase session before mapping it to the local `users` table.

## CSV Workflow

CSV uploads are validated against the database, stored as artifacts in Supabase Storage, and approved into transactions through the unified API surface.

## Deployment Notes

- The app is intended to be deployed as a single Vercel project.
- Vercel should run `npm run prisma:generate && npm run build` so the Prisma client is available during production builds.
- Set these environment variables in the Vercel project settings for Production, Preview, and Development:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://user:password@host:5432/database
SUPABASE_STORAGE_BUCKET_NAME=donations
```

- `SUPABASE_STORAGE_BUCKET_NAME` defaults to `donations` if omitted, but setting it explicitly keeps uploads and CSV artifacts consistent across environments.
- The heavier CSV and donation-drive API routes are configured with a longer Vercel function timeout to handle uploads, validation, and approval workflows.

## Health Check

The health endpoint returns the current deployment target and backend metadata:

```bash
GET /api/health
```

## Verification

The current codebase has been validated with a production build.
