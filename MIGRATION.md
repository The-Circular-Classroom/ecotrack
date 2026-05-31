# Migration Plan

This document tracks the remaining work to fully migrate EcoTrack off the AWS multi-repo / Lambda setup and onto the unified Vercel + Supabase codebase.

## Goals

- Move application runtime to a single Next.js deployment on Vercel.
- Move application data to Supabase Postgres with Prisma as the data access layer.
- Replace AWS Lambda auth, CSV processing, and user-management services.
- Retire legacy AWS infrastructure only after data, routes, and workflows are verified.

## Current Target State

- Frontend and API routes live in `ecotrack-unified`.
- Auth uses Supabase sessions instead of Cognito-backed Lambda endpoints.
- Database access goes through Prisma against the Supabase Postgres database.
- CSV artifacts are stored in Supabase Storage.
- Legacy UI surfaces are preserved as App Router pages only where needed for parity.

## Database Migration Work

### 1. Finalize schema parity

- Compare the old AWS-era Prisma schemas with `prisma/schema.prisma`.
- Confirm every required table, relation, enum, and nullable field matches the unified app’s needs.
- Verify lookup tables and reporting tables cover the old inventory, donation, transaction, and school workflows.

### 2. Apply and validate migrations

- Run `npx prisma validate`.
- Run `npx prisma generate`.
- Apply schema updates to the Supabase Postgres database.
- Confirm production and staging databases are on the same schema version.

### 3. Migrate existing data

- Export data from the AWS-backed database.
- Transform legacy records to the unified schema where names or structures changed.
- Import users, schools, inventory, donation drives, transactions, and catalog data.
- Reconcile identity mappings for any user IDs or school IDs that changed during cutover.

### 4. Verify data integrity

- Validate row counts for the major entities.
- Spot-check relationships for users, schools, donation drives, and inventory balances.
- Verify reporting outputs match legacy totals for a representative set of schools and time ranges.
- Confirm CSV approval history and transaction history remain consistent after migration.

## System Migration Work

### 1. Replace AWS auth flows

- Keep Supabase authentication as the only active sign-in path.
- Ensure the auth pages and session helpers handle login, signup, reset, MFA-style flows, and logout behavior expected by the unified UI.
- Remove any remaining dependencies on Cognito-specific runtime behavior once parity is confirmed.

### 2. Replace Lambda-backed APIs

- Keep the unified API routes for users, CSV processing, donation drives, inventory, analytics, collection, assembly, and reporting.
- Confirm every legacy endpoint family has a corresponding route or intentional replacement.
- Validate request authorization and role checks against the unified request context.

### 3. Replace file and CSV storage

- Store uploaded CSV artifacts in Supabase Storage.
- Confirm upload, validation, approval, and failure paths are preserved.
- Verify file naming, bucket selection, and artifact movement behavior before disabling the AWS path.

### 4. Replace frontend entry points

- Keep the legacy route names that users still reach, but map them into the unified app.
- Remove or deprecate old frontend deployments after all routes are available in the new codebase.
- Ensure navigation, FAQ references, and admin flows point only to the unified app.

## Cutover Checklist

- [ ] Production Supabase database is fully migrated.
- [ ] Prisma schema and generated client are current.
- [ ] Auth flows are working against Supabase in production.
- [ ] CSV upload and approval flows are working end to end.
- [ ] User management routes match the required legacy behavior.
- [ ] Donation drive, inventory, analytics, and report routes are verified.
- [ ] Legacy AWS endpoints are no longer required by any client code.
- [ ] Vercel environment variables are configured.
- [ ] Supabase storage bucket is configured.
- [ ] Smoke tests pass in staging and production.

## Validation Steps

Run these checks before and after cutover:

```bash
npm run prisma:generate
npm run build
npm run lint
```

For database parity, also verify:

- User login and profile lookup.
- CSV upload, validation, approval, and artifact storage.
- User listing and admin user actions.
- Donation drive and transaction reporting.
- School analytics and admin summaries.

## Rollback Plan

- Keep the AWS stack available until the unified app passes smoke tests.
- Retain backups of the source database and migrated Supabase database.
- If a production issue is found, revert traffic before deleting AWS resources.

## Decommissioning AWS

Only after the unified app is stable:

- Disable or delete the Lambda services.
- Remove old AWS deployment pipelines.
- Archive or delete obsolete environment secrets.
- Shut down legacy storage and queue resources after confirming they are unused.
