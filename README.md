# Ecotrack - Unified Platform

A comprehensive inventory management and analytics platform for The Circular Classroom, consolidating inventory tracking, donation management, and optimization analytics into a single, scalable application.

**Deployed on:** Vercel (frontend + backend) + Supabase PostgreSQL DB

## ⚡ Quick Start

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x
- Supabase project with PostgreSQL database
- AWS credentials (for S3, SES, SNS)
- Cognito User Pool for authentication

### Installation

```bash
# Install dependencies for all workspaces
npm install

# Create .env file from template
cp .env.example .env

# Update with your actual credentials
nano .env
```

### Development

```bash
# Start both frontend and backend in development mode
npm run dev

# Or start them separately:
npm --workspace=apps/frontend run dev
npm --workspace=apps/backend run start
```

Frontend will be on `http://localhost:3000`  
Backend API on `http://localhost:3000/api`

### Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (development)
npm run prisma:migrate

# Apply migrations (production)
npm run prisma:migrate:prod

# Seed database
npm run prisma:db:seed

# Open Prisma Studio
npm --workspace=packages/database run studio
```

## 📁 Project Structure

```
ecotrack/
├── apps/
│   ├── frontend/          # Next.js frontend application
│   │   ├── src/app        # Pages and layouts
│   │   ├── src/components # React components
│   │   ├── src/utils      # Utilities (auth, API client)
│   │   ├── public/        # Static assets
│   │   └── next.config.mjs
│   └── backend/           # Express.js unified API
│       ├── routes/        # API route handlers
│       │   ├── *.js       # Inventory routes
│       │   └── analytics.*.js  # Analytics routes
│       ├── controllers/   # Request handlers
│       ├── services/      # Business logic
│       ├── models/        # Service layer
│       ├── middlewares/   # Auth & utility middleware
│       ├── seeders/       # Database seeders
│       └── app.js         # Express app entry point
├── packages/
│   └── database/          # Shared Prisma schema
│       ├── prisma/
│       │   ├── schema.prisma  # Single source of truth
│       │   ├── migrations/    # Database version history
│       │   └── seed.ts        # Initial data seeding
│       └── package.json
├── .env.example           # Environment template
├── package.json           # Workspace root config
├── vercel.json            # Vercel deployment config
└── .github/workflows/     # CI/CD pipelines
```

## 🏗️ Architecture

### Frontend (Next.js)
- **Framework:** Next.js 16.2 with App Router
- **Styling:** Tailwind CSS + Material UI
- **State:** React hooks + localStorage for session
- **Auth:** AWS Cognito (JWT-based)
- **Deployment:** Vercel

**Key Features:**
- Inventory management dashboard
- Analytics and reporting
- Donation drive tracking
- User role-based access control
- CSV import/export
- PWA support

### Backend (Express.js)
- **Framework:** Express 5.2
- **Database:** PostgreSQL via Prisma ORM
- **Authentication:** AWS Cognito JWT verification + role-based access control
- **File Storage:** AWS S3
- **Email:** AWS SES
- **Notifications:** AWS SNS
- **Optimization:** JavaScript LP Solver for assembly planning
- **Deployment:** Vercel Functions (or traditional Node)

**Key API Routes:**
- `/api/brand` - Brand management
- `/api/category` - Item categories
- `/api/inventory` - Inventory tracking
- `/api/transaction` - Immutable ledger
- `/api/donation-drive` - Donation campaigns
- `/api/analytics/collection` - Collection metrics
- `/api/analytics/assembly` - Optimization algorithms
- `/api/analytics/overview` - Network KPIs
- `/api/analytics/report` - PDF generation

### Database (Supabase PostgreSQL)
- **ORM:** Prisma 7.5
- **Schema:** Shared across frontend and backend
- **Tables:** 23 models covering inventory, users, transactions, analytics
- **Migrations:** Version-controlled in `packages/database/prisma/migrations/`

## 🔐 Environment Variables

See `.env.example` for all required variables. Key ones:

```env
# Database
DATABASE_URL=postgresql://...@db.supabase.co/...

# AWS Cognito
COGNITO_USER_POOL_ID=...
COGNITO_CLIENT_ID=...

# AWS Services
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-southeast-1
S3_BUCKET_NAME=...
SES_SENDER_EMAIL=...
SNS_TOPIC_ARN=...

# Frontend
NEXT_PUBLIC_API_URL=https://backend-api.vercel.app/api
```

## 🚀 Deployment

### Vercel (Frontend + Backend)

1. **Connect repository** to Vercel
2. **Add environment variables** in Vercel project settings
3. **Configure builds:**
   - Frontend: `npm run build:frontend`
   - Backend: `npm --workspace=apps/backend run start`
4. **Deploy** - automatically on push to `main`

### GitHub Actions CI/CD

- **`.github/workflows/vercel-deploy.yml`** - Builds and deploys to Vercel on main branch
- **`.github/workflows/validate-conventions.yml`** - Validates commit conventions

## 📊 Database Schema

### Core Entities
- **School** - Partner institutions
- **User** - End users (Admin, SchoolStaff, Parent, PsgVolunteer)
- **DonationDrive** - Collection campaigns
- **Transaction** - Immutable ledger (DonationIn, Transfer, Sale, etc.)
- **ItemType** - SKU definitions
- **InventoryBalance** - Current stock tracking
- **Category** - Item classification with weight metrics
- **Product/Recipe** - Assembly configurations

See `packages/database/prisma/schema.prisma` for full schema.

## 🧪 Testing

```bash
# Run backend tests
npm --workspace=apps/backend run test

# With coverage
npm --workspace=apps/backend run test:coverage

# Run specific test file
npm --workspace=apps/backend run test -- reportController.test.js
```

## 📝 Naming Conventions

- **Routes:** `/api/{resource}` for inventory, `/api/analytics/{feature}` for analytics
- **Controllers:** `{resource}Controller.js` (e.g., `inventoryController.js`)
- **Services:** Files in `/services` and `/models` directories
- **Branch names:** `feature/`, `bugfix/`, `hotfix/`, `release/`
- **Commits:** Follow Conventional Commits (feat:, fix:, docs:, etc.)

## 🛠️ Development Workflow

1. **Create feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** and commit with Conventional Commits:
   ```bash
   git commit -m "feat: add new feature"
   ```

3. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **CI/CD validates** builds and tests
5. **Deploy** automatically on merge to main

## 📚 API Documentation

Swagger docs available at `/swagger-output.json` on backend. Generate with:

```bash
npm --workspace=apps/backend run swagger
```

## 🤝 Contributing

1. Follow commit conventions (commitlint enforced)
2. Ensure builds pass locally: `npm run build`
3. Write tests for new features
4. Update README if adding major features
5. Ensure all lint checks pass: `npm run lint`

## 📄 License

MIT

## 👥 Team

The Circular Classroom

---

**Last Updated:** April 2026  
**Version:** 1.0.0  
**Status:** Production Ready
