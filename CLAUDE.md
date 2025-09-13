# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Saasfly is an enterprise-grade Next.js SaaS boilerplate built on a monorepo architecture using Turborepo. The project provides a complete solution for building SaaS applications with authentication, payment processing, email templates, and a comprehensive UI component library.

## Architecture

### Monorepo Structure
- **apps/**: Application packages
  - `nextjs`: Main Next.js application
  - `auth-proxy`: Authentication proxy service
- **packages/**: Shared packages
  - `api`: tRPC API layer
  - `auth`: Authentication utilities (Clerk integration)
  - `db`: Database schema and utilities (PostgreSQL + Prisma + Kysely)
  - `stripe`: Payment processing
  - `ui`: Shared UI components (shadcn/ui + Radix)
- **tooling/**: Development tools and configurations
  - `eslint-config`: ESLint configurations
  - `prettier-config`: Prettier configurations
  - `tailwind-config`: Tailwind CSS configurations
  - `typescript-config`: TypeScript configurations

### Key Technologies
- **Framework**: Next.js 14 with App Directory
- **Authentication**: Clerk (default since June 2025)
- **Database**: PostgreSQL with Prisma (schema) + Kysely (queries)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand + TanStack React Query
- **API**: tRPC for end-to-end type safety
- **Payments**: Stripe integration
- **Email**: React Email + Resend
- **Package Manager**: Bun (required)

## Development Commands

### Setup
```bash
# Install dependencies
bun install

# Setup environment variables
cp .env.example .env.local

# Push database schema (requires database setup)
bun db:push
```

### Development
```bash
# Start all services in development mode
bun run dev

# Start web app only (excludes Stripe service)
bun run dev:web

# Start specific app
turbo dev --filter @saasfly/nextjs
```

### Building & Testing
```bash
# Build all packages
bun run build

# Type checking
bun run typecheck

# Linting
bun run lint
bun run lint:fix

# Formatting
bun run format
bun run format:fix
```

### Database
```bash
# Push schema changes to database
bun db:push
```

## Code Conventions

### File Organization
- Use the existing workspace structure for new packages
- Follow the established naming conventions (kebab-case for packages, PascalCase for components)
- Place shared utilities in appropriate packages (`common`, `ui`, etc.)

### Import Strategy
- Use workspace references (`@saasfly/package-name`) for internal packages
- Check existing dependencies before adding new ones
- Follow the established patterns for tRPC, authentication, and database queries

### Environment Configuration
- Environment variables are managed at the root level (`.env.local`)
- Use T3 Env for environment variable validation
- Reference the `.env.example` file for required variables

## Authentication Notes
- Primary authentication provider is Clerk (since June 2025)
- NextAuth implementation available on `feature-nextauth` branch
- Admin access controlled via `ADMIN_EMAIL` environment variable
- Admin dashboard available at `/admin/dashboard`

## Database Architecture
- Prisma used for schema definition and migrations
- Kysely used for type-safe query building
- PostgreSQL as the primary database
- Database utilities located in `packages/db`