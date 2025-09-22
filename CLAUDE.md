# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 14 web dashboard application for DOF performance monitoring. It uses TypeScript, shadcn/ui components, Supabase for authentication, and follows modern React patterns with Server Components and App Router.

## Development Commands

### Core Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run prettier` - Check code formatting
- `npm run prettier:fix` - Auto-fix formatting
- `npm run type-check` - Run TypeScript type checking

### Testing

- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `jest path/to/test.test.tsx` - Run single test file

## Architecture Overview

### Authentication Flow

The app uses a dual Supabase client pattern:

- **Server Client** (`lib/supabase/server.ts`) - For Server Components and API routes
- **Client Client** (`lib/supabase/client.ts`) - For Client Components

Authentication state flows through:

1. **Middleware** (`middleware.ts`) - Handles route protection and redirects unauthenticated users
2. **AuthProvider** (`components/auth/auth-provider.tsx`) - React Context providing user state and auth methods
3. **Auth utilities** (`lib/auth.ts`) - Server-side auth helpers like `requireAuth()` and `getUser()`

### Layout Architecture

The application uses a nested layout pattern:

- **Root Layout** (`app/layout.tsx`) - Basic HTML structure and global styles
- **Dashboard Layout** (`components/layout/dashboard-layout.tsx`) - Main dashboard wrapper with AuthProvider, Header, and Sidebar
- **Page Layouts** - Individual pages use DashboardLayout wrapper

The DashboardLayout automatically handles:

- Authentication state via AuthProvider context
- Responsive navigation (desktop sidebar + mobile sheet)
- Header with user menu and logout functionality

### Component Organization

- **UI Components** (`components/ui/`) - shadcn/ui base components (Button, Card, etc.)
- **Layout Components** (`components/layout/`) - Dashboard structure (Header, Sidebar, DashboardLayout)
- **Auth Components** (`components/auth/`) - Authentication-related components (LoginForm, AuthProvider)

### Routing & Pages

The app uses Next.js 14 App Router with the following structure:

- `/` - Welcome page with navigation cards (uses DashboardLayout)
- `/dashboard` - Main performance metrics overview
- `/metrics` - Detailed analytics and performance trends
- `/devices` - Device management interface
- `/alerts` - Alert management and configuration
- `/auth/login` - Authentication page (no DashboardLayout)
- `/auth/callback` - OAuth callback handler

All dashboard pages use `export const dynamic = "force-dynamic"` to ensure server-side rendering with user authentication.

### State Management

- **Authentication** - React Context via AuthProvider
- **Forms** - react-hook-form with zod validation
- **Server State** - Supabase clients handle data fetching

### Styling System

- **Tailwind CSS** - Utility-first styling with custom design tokens
- **shadcn/ui** - Component library with custom theme configuration
- **CSS Variables** - Design tokens defined in `app/globals.css`

## Environment Variables

Required environment variables (see `.env.local.example`):

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)

## Testing Configuration

Jest is configured with Next.js integration:

- Test files: `__tests__/**/*.test.{ts,tsx}`
- Setup file: `jest.setup.js` (includes mocks for Next.js router and Supabase)
- Coverage excludes layout files and type definitions
- Uses React Testing Library for component tests

## Key Patterns

### Server vs Client Components

- Use Server Components by default for better performance
- Add `"use client"` only when needed for interactivity
- Authentication components require client-side state management

### Type Safety

- All components and utilities are fully typed with TypeScript
- Path aliases use `@/*` for imports
- Supabase types are generated in `types/database.ts`

### Navigation

- Sidebar navigation uses `usePathname()` for active state highlighting
- Navigation items are defined in `components/layout/sidebar.tsx`
- Mobile navigation uses shadcn Sheet component

### Form Handling

- Use react-hook-form with zod schemas for validation
- shadcn Form components provide consistent styling
- Error states are handled automatically by Form components

## Specialized Agents

This project has specialized Claude Code agents in `.claude/agents/` that should be used **proactively** when their expertise is needed:

### react-nextjs-expert

**Use for any Next.js development work** - App Router, Server Components, Server Actions, SSR/SSG, performance optimization, and modern Next.js patterns. Always use this agent when:

- Implementing new Next.js features or pages
- Working with routing, layouts, or metadata
- Optimizing performance or bundle size
- Using Server Components vs Client Components
- Implementing data fetching patterns

### debug-specialist

**Use immediately when encountering any technical issues** - Errors, test failures, build problems, or unexpected behavior. Use this agent when:

- Build or compilation errors occur
- Tests are failing unexpectedly
- Runtime errors or unexpected application behavior
- Performance issues or memory leaks
- Configuration problems

### code-reviewer

**Use after completing any coding task** - Comprehensive quality assessment focusing on type safety, Next.js best practices, and maintainability. Use this agent after:

- Writing new components or utilities
- Refactoring existing code
- Implementing new features
- Making architectural changes
- Before opening pull requests

### sql-pro

**Use for database-related work** - Complex queries, schema design, and database optimization. Use when:

- Writing or optimizing SQL queries
- Designing database schemas
- Working with Supabase database operations
- Performance tuning database interactions

### data-analyst

**Use for data analysis tasks** - Working with analytics, metrics, or data insights. Use when:

- Analyzing performance metrics
- Working with dashboard data visualization
- Creating reports or analytics features
- Processing large datasets

### payment-integration

**Use when implementing billing or subscription features** - Stripe, PayPal, and payment processing. Use when:

- Adding payment functionality
- Implementing subscription management
- Handling billing workflows
- Working with payment webhooks

## Agent Usage Pattern

Always use the Task tool to launch these agents proactively. For example:

- When adding a new dashboard page → Use react-nextjs-expert
- When encountering a build error → Use debug-specialist
- After implementing a new feature → Use code-reviewer
- When working with analytics data → Use data-analyst
