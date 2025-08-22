# Artfromromania Monorepo

A production-ready pnpm + Turbo monorepo for Artfromromania (SEO-first art marketplace).

## Prerequisites
- Node 20 (use .nvmrc)
- pnpm 9 (Corepack recommended)
- Docker (for local PostgreSQL)

## Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   ```

3. **Start database:**
   ```bash
   pnpm db:up
   ```

4. **Run migrations and seed:**
   ```bash
   pnpm db:migrate && pnpm db:generate && pnpm db:seed
   ```

5. **Start development servers:**
   ```bash
   pnpm dev
   ```

## Scripts

### Development
- `dev`: run all apps in dev via Turbo
- `build`: build all packages and apps
- `typecheck`: TS type-check all
- `lint`: ESLint across repo
- `test`: run tests
- `format`: Prettier format

### Database
- `db:up`: start PostgreSQL with Docker
- `db:down`: stop and remove PostgreSQL container
- `db:migrate`: run database migrations
- `db:generate`: generate Prisma client
- `db:seed`: seed database with sample data
- `db:studio`: open Prisma Studio
- `db:reset`: reset database and re-seed

## Apps & Packages

### Apps
- **apps/web**: Next.js App Router, SSR/ISR, Tailwind CSS, shadcn/ui
- **apps/api**: Fastify API with Prisma database integration

### Packages
- **packages/tsconfig**: Shared TypeScript configurations
- **packages/eslint-config**: Shared ESLint configuration
- **packages/shared**: Common utilities, types, and environment validation
- **packages/db**: Prisma schema, migrations, and database client

## Database Schema

The marketplace includes:
- **Users** (ADMIN, ARTIST, BUYER roles)
- **Artists** with detailed profiles and social links
- **Artworks** (Original, Editioned, Digital) with pricing
- **Editions** for prints and digital downloads
- **Orders** with payment processing
- **Payouts** with platform commission calculation
- **Audit logs** for compliance

## Local Development Workflow

1. **Database first:**
   ```bash
   pnpm db:up          # Start PostgreSQL
   pnpm db:migrate     # Apply migrations
   pnpm db:seed        # Add sample data
   ```

2. **Development:**
   ```bash
   pnpm dev            # Start all services
   ```

3. **Access endpoints:**
   - Web: http://localhost:3000
   - API: http://localhost:3001
   - API Health: http://localhost:3001/healthz
   - Prisma Studio: http://localhost:5555

## CI/CD
GitHub Actions workflow builds, tests, and uploads artifacts. Web: Vercel, API: Railway/Fly.
