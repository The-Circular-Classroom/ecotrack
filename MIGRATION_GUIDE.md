# Migration Guide: From 3 Codebases to Unified Ecotrack

## Overview
This document describes the major refactoring that consolidated three separate codebases (frontend, analytics-backend, inventory-backend) into a single unified application deployed on Vercel + Supabase.

## What Changed

### 📖 Directory Structure

**Before:**
```
ecotrack/
├── frontend/
│   └── apps/frontend/    # Next.js app
├── analytics-backend/    # separate Express backend
├── inventory-backend/    # separate Express backend
```

**After:**
```
ecotrack/
├── apps/
│   ├── frontend/         # Next.js moved here
│   └── backend/          # Merged Express backend
├── packages/
│   └── database/         # Shared Prisma schema
```

### 🔌 API Endpoints

**Before:**
- Frontend called 3 separate APIs:
  - `https://auth-service.com/api`
  - `https://inventory-api.com/api`
  - `https://analytics-api.com/api`
- AWS deployment with Docker containers
- S3 CloudFront for static frontend

**After:**
- Single consolidated API:
  - Inventory routes: `/api/brand`, `/api/category`, `/api/inventory`, etc.
  - Analytics routes: `/api/collection`, `/api/assembly`, `/api/overview`, `/api/report`, `/api/school`
- Vercel deployment (serverless)
- Supabase PostgreSQL (instead of AWS RDS)
- Single environment configuration

### 🏗️ Backend Consolidation

**Routes Merged:**
- Inventory routes remain under `/api/{resource}`
- Analytics routes are now mounted flat under `/api/{feature}`
- All routes now served by single Express app on single backend

**Controllers & Services:**
- Analytics controllers maintain original names
- Inventory controllers maintain original names
- Services merged with appropriate namespacing
- New LP solver service for assembly optimization
- PDF report generation integrated

**Middleware:**
- Single JWT verification via Cognito (duplicates removed)
- Unified error handling
- Shared CORS/compression configuration

**Database:**
- Single Prisma schema in `/packages/database/prisma/schema.prisma`
- Both backends now reference the same database
- Migrations centralized in `packages/database/prisma/migrations/`

### 🎨 Frontend Changes

**Environment Variables (Before):**
```env
NEXT_PUBLIC_INVENTORY_API_URL=https://inventory-api.com
NEXT_PUBLIC_ANALYTICS_API_URL=https://analytics-api.com
NEXT_PUBLIC_AUTH_API_URL=https://auth-service.com
```

**Environment Variables (After):**
```env
NEXT_PUBLIC_API_URL=https://ecotrack-backend.vercel.app
# All API calls route through single backend
```

**API Client:**
- New unified API client in `src/utils/apiClient.js`
- Supports both inventory and analytics endpoints through single base URL
- Automatic environment-aware URL resolution

**Next.js Config:**
- Removed `output: 'export'` for static-only build
- Added Vercel rewrites for local development
- Configured for Vercel deployment

### 🗄️ Database Migration

**Before:** AWS RDS PostgreSQL (separate schemas per backend)

**After:** Supabase PostgreSQL (single consolidated schema)

No data migration needed (starting fresh as per requirements).

### ☁️ Infrastructure

**Deployment (Before):**
- AWS OIDC authentication
- Docker containers for backends
- S3 static hosting for frontend
- CloudFront CDN
- RDS for database

**Deployment (After):**
- GitHub → Vercel (automatic deployments)
- Vercel Functions for backend (or traditional Node)
- Vercel hosting for frontend
- Supabase PostgreSQL database
- AWS services (S3, SES, SNS) still used for file/email operations

## Breaking Changes

### API Routes Changed
- Analytics endpoints moved from `https://analytics-api.com/api/report/admin` to `https://backend.vercel.app/api/analytics/report/admin`
- Frontend environment variable changed from `NEXT_PUBLIC_INVENTORY_API_URL` to `NEXT_PUBLIC_API_URL`
- All API calls now route through unified backend

### Environment Setup
- `.env` file structure simplified
- Single environment file at root + one per app
- Vercel secrets configuration required

### Deployment Process
- No more AWS OIDC setup
- Vercel GitHub integration instead
- No Docker required for development/deployment
- Supabase credentials instead of AWS RDS

## Migration Checklist

For deploying this consolidated version:

- [ ] Set up Supabase account and create PostgreSQL database
- [ ] Generate connection string and set `DATABASE_URL`
- [ ] Create AWS Cognito user pool (or reuse existing)
- [ ] Set AWS credentials for S3, SES, SNS
- [ ] Update GitHub repository with new structure
- [ ] Create Vercel account and link repository
- [ ] Set all environment variables in Vercel project settings:
  - `DATABASE_URL`
  - `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`
  - `AWS_*` credentials and configuration
  - `NEXT_PUBLIC_API_URL` (Vercel backend URL)
- [ ] Deploy to Vercel (automatic on push to main)
- [ ] Run database migrations: `npm run prisma:migrate:prod`
- [ ] Verify all endpoints working
- [ ] Update client DNS/URLs pointing to new Vercel domain

## Backwards Compatibility

⚠️ **Breaking Changes:** Old API endpoints no longer work. Frontend and backend must upgrade together.

If you need to maintain the old deployment alongside this unified version:
1. Keep old repository branches/tags
2. Don't delete AWS infrastructure
3. Deploy unified version separately

## Benefits

✅ **Unified Codebase**
- Single source of truth for logic
- Easier maintenance and updates
- Reduced deployment complexity

✅ **Cost Efficiency**
- Vercel pricing model better for this workload
- AWS only used for necessary services (auth, storage)
- Fewer infrastructure components

✅ **Developer Experience**
- One repository to manage
- Single monorepo workspace
- Simpler development setup
- Unified CI/CD pipeline

✅ **Scalability**
- Easier to add new features
- Better code sharing
- Standardized patterns

## Troubleshooting

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` is set on Vercel
- Check backend is deployed and responding to `/health`
- Verify CORS is enabled

### Database connection error
- Verify `DATABASE_URL` is correct
- Check Supabase database is running
- Ensure IP whitelist includes Vercel IPs

### Analytics endpoints returning 404
- Verify routes prefixed with `/api/analytics/`
- Check analytics controllers are properly namespaced
- Ensure analytics.*.js files are correctly referenced in app.js

### Missing dependencies
- Run `npm install` in workspace root
- Verify `.env` has all required variables
- Check Node.js version >= 20.x

## Support

For questions or issues:
1. Check this migration guide
2. Review README.md for setup instructions
3. Check GitHub issues for known problems
4. Contact development team

---

**Migration Date:** April 26, 2026  
**Status:** Complete - Ready for Production
