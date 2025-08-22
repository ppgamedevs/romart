# @romart/db

Database package for RomArt marketplace using Prisma with PostgreSQL.

## Features

- **Prisma ORM** with PostgreSQL
- **Complete marketplace schema** with Users, Artists, Artworks, Orders, Payouts
- **Type-safe database operations** with generated Prisma client
- **Seed data** for development and testing
- **Database migrations** for schema versioning

## Schema Overview

### Core Models

- **User** - Authentication and user management (ADMIN, ARTIST, BUYER roles)
- **Artist** - Artist profiles with detailed information and social links
- **Artwork** - Art pieces with pricing, dimensions, and metadata
- **Edition** - Print and digital editions with inventory tracking
- **Order** - Purchase orders with payment processing
- **OrderItem** - Individual items within orders
- **Payout** - Artist payouts with platform commission calculation
- **Address** - Shipping and billing addresses
- **AuditLog** - System audit trail

### Key Features

- **Money handling** in minor units (cents) with ISO currency codes
- **Platform commission** calculation (30% default, configurable)
- **Inventory tracking** for editions
- **Audit logging** for compliance
- **Flexible pricing** for originals, editions, and digital works

## Usage

### Import the Prisma client

```typescript
import { prisma } from "@romart/db"

// Query users
const users = await prisma.user.findMany({
  include: { artist: true }
})

// Create an artwork
const artwork = await prisma.artwork.create({
  data: {
    artistId: "artist_id",
    slug: "my-artwork-2024",
    title: "My Artwork",
    priceAmount: 250000, // €2,500.00
    priceCurrency: "EUR",
    kind: "ORIGINAL"
  }
})
```

### Import types

```typescript
import type { User, Artist, Artwork } from "@romart/db"

// Use generated types
const user: User = { /* ... */ }
const artistWithUser: ArtistWithUser = { /* ... */ }
```

## Development

### Prisma Commands

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Open Prisma Studio
pnpm db:studio

# Reset database
pnpm db:reset
```

### Database Setup

1. Start PostgreSQL: `pnpm db:up`
2. Run migrations: `pnpm db:migrate`
3. Seed data: `pnpm db:seed`

## Environment Variables

Required in your `.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/romart?schema=public"
```

## Money Handling

All monetary values are stored in **minor units** (cents):

- €2,500.00 → `250000`
- €150.00 → `15000`
- €14.99 → `1499`

This prevents floating-point precision issues and ensures accurate financial calculations.

## Platform Commission

The platform takes a commission on each sale:

- **Default**: 30% (3000 basis points)
- **Artist receives**: 70% of the sale price
- **Configurable** per order via `platformFeeBps`

Example:
- Artwork price: €1,000.00
- Platform fee: 30% (€300.00)
- Artist payout: €700.00
