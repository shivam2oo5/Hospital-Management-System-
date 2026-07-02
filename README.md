INTERN ID: CITS5278
# Hospital Management System

Hospital Hub is a monorepo-based Hospital Management System (HMS) that combines a React + Vite frontend with an Express backend and shared TypeScript libraries.

## Project Overview

Hospital Hub provides a full-stack hospital administration application with support for:
- patient management
- doctor management
- appointment scheduling
- admissions management
- medical records
- lab orders
- pharmacy workflows
- invoicing and billing
- staff and department management
- role-aware dashboard pages and settings

The repository is organized as a pnpm workspace with separate frontend, backend, database, and shared library packages.

## Repository Structure

- `artifacts/hms` — Main frontend application built with React, Vite, and TypeScript.
- `artifacts/api-server` — Backend API server built with Express, TypeScript, and Pino logging.
- `lib/api-client-react` — Shared React API client package for frontend data fetching.
- `lib/api-spec` — OpenAPI schema and code generation configuration.
- `lib/api-zod` — Zod-based API validation and schema helpers.
- `lib/db` — Database package with Drizzle ORM schemas and database utilities.
- `scripts` — Utility scripts package.
- `package.json` — Root workspace configuration for build and typecheck orchestration.

## Key Features

- Modular monorepo architecture using pnpm workspaces
- React frontend with client-side routing via Wouter
- Global state and data fetching via React Query
- Backend API routes mounted under `/api`
- Drizzle ORM database schema and migrations support
- Shared API client and schema packages for consistency
- Type-safe TypeScript code across frontend, backend, and libraries

## Tech Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS, React Query, Wouter
- Backend: Express, TypeScript, Pino logging, CORS, cookie-parser
- Database: Drizzle ORM, Drizzle Zod, PostgreSQL client (`pg`)
- Shared packages: API client, API schema generation, Zod validation

## Prerequisites

- Node.js 18 or newer
- Corepack
- pnpm

## Installation

From the project root:

```bash
corepack enable
corepack pnpm install
```

## Development

### Start the frontend

```bash
corepack pnpm --filter @workspace/hms dev
```

### Start the backend

Set the `PORT` environment variable before starting the backend server.

On macOS/Linux:

```bash
export PORT=3000
corepack pnpm --filter @workspace/api-server dev
```

On Windows PowerShell:

```powershell
$env:PORT = 3000
corepack pnpm --filter @workspace/api-server dev
```

### Build all packages

```bash
corepack pnpm build
```

### Run type checking

```bash
corepack pnpm typecheck
```

## Package Scripts

### Root workspace scripts

- `build` — Runs typecheck and builds all workspace packages.
- `typecheck` — Runs TypeScript checks across workspace packages.

### Frontend package (`@workspace/hms`)

- `dev` — Start Vite development server.
- `build` — Build the production frontend.
- `serve` — Preview the built frontend.
- `typecheck` — Run TypeScript typecheck for the frontend.

### Backend package (`@workspace/api-server`)

- `dev` — Build backend and start the server in development.
- `build` — Compile the backend via `build.mjs`.
- `start` — Run the compiled backend with source maps enabled.
- `typecheck` — Run TypeScript typecheck for the backend.

### Scripts package (`@workspace/scripts`)

- `hello` — Run a simple example script.
- `typecheck` — Run TypeScript typecheck for the scripts package.

### Database package (`@workspace/db`)

- `push` — Apply database migrations with Drizzle Kit.
- `push-force` — Force apply database changes.

## Frontend Routes

The frontend application includes routes for:
- `/login`
- `/dashboard`
- `/patients`
- `/patients/new`
- `/patients/:id`
- `/doctors`
- `/doctors/new`
- `/doctors/:id`
- `/appointments`
- `/appointments/new`
- `/admissions`
- `/admissions/new`
- `/medical-records`
- `/lab-orders`
- `/pharmacy`
- `/billing`
- `/billing/new`
- `/staff`
- `/departments`
- `/settings`

The default root path `/` redirects to `/dashboard`.

## Backend Details

- `artifacts/api-server/src/app.ts` — Express application setup
- `artifacts/api-server/src/index.ts` — Server bootstrap and port validation
- API routes are mounted under `/api`
- Uses CORS, JSON request parsing, and URL-encoded form parsing
- Includes request logging via Pino

## Notes

- This repository is structured as a multi-package pnpm workspace. Work inside the correct package when editing frontend, backend, or shared libraries.
- The backend requires a valid `PORT` environment variable to start.
- For Windows development, use PowerShell environment assignment or install a cross-platform environment variable helper if needed.

## License

This workspace is configured as a private project, but you can add a license section or adjust the `license` field in the root `package.json` as needed.
