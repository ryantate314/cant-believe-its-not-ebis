# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cirrus MRO is a full-stack web application with:
- **Frontend:** Next.js 16 (React 19, TypeScript, Tailwind CSS 4)
- **Backend:** FastAPI (Python 3.12+)
- **Database:** PostgreSQL with Flyway migrations
- **Infrastructure:** Terraform (Azure)

## Common Commands

All commands are run from the repository root via Make:

### Development Servers
```bash
make api-run    # Start FastAPI dev server (port 8000)
make ui-run     # Start Next.js dev server (port 3000)
```

### Database Migrations (Flyway via Docker)
```bash
make db-migrate              # Run pending migrations
make db-info                 # Show migration status
make db-validate             # Validate migration scripts
make db-add DESC="name"      # Create new migration file
make db-baseline             # Initialize baseline version
make db-repair               # Repair Flyway metadata
```

### UI Commands (from app/ui)
```bash
yarn dev        # Dev server
yarn build      # Production build
yarn lint       # ESLint
```

### Infrastructure
```bash
make terraform-apply    # Deploy to Azure (uses config/dev.tfvars)
```

### Testing
```bash
make api-test              # Run backend tests
make api-test-cov          # Run backend tests with coverage report
make ui-test               # Run frontend unit/integration tests
make ui-test-cov           # Run frontend tests with coverage
make ui-test-e2e           # Run Playwright E2E tests
make test                  # Run all tests (backend + frontend)
```

For detailed testing methodology, see [docs/testing.md](docs/testing.md).

## Architecture

```
app/
├── api/          # FastAPI backend (UV package manager)
│   └── main.py   # Application entry point
└── ui/           # Next.js frontend (Yarn)
    └── src/app/  # App router pages

database/
├── .env          # DB credentials (copy from .env.example)
└── migrations/   # Flyway SQL migration files

infrastructure/   # Terraform Azure configuration
├── provider.tf   # Azure provider setup
├── variables.tf  # Input variables
└── config/       # Environment-specific tfvars
```

## API Architecture

- **No direct database access from Next.js:** The frontend must never connect directly to the database
- **Proxy pattern:** Create Next.js API routes (`app/api/`) that proxy requests to FastAPI endpoints
- **FastAPI is the backend:** All database operations, business logic, and data access happen in the FastAPI backend (port 8000)
- **Next.js API routes:** Use only as a pass-through layer to the FastAPI backend

## Backend Development Conventions

### API Endpoint Naming

Every FastAPI endpoint **must** include an explicit `operation_id` parameter. This controls the generated TypeScript SDK function names. Without it, Orval generates unwieldy names like `useListWorkOrdersApiV1WorkOrdersGet`.

**Naming convention:** Use camelCase with the pattern `{verb}{Resource}`:
- `listWorkOrders`, `getWorkOrder`, `createWorkOrder`, `updateWorkOrder`, `deleteWorkOrder`
- `listWorkOrderItems`, `getWorkOrderItem`, `createWorkOrderItem`, etc.

**Example:**
```python
@router.get("", response_model=WorkOrderListResponse, operation_id="listWorkOrders")
async def list_work_orders(...):

@router.get("/{work_order_id}", response_model=WorkOrderResponse, operation_id="getWorkOrder")
async def get_work_order(...):

@router.post("", response_model=WorkOrderResponse, status_code=201, operation_id="createWorkOrder")
async def create_new_work_order(...):
```

This produces clean SDK names: `useListWorkOrders`, `useGetWorkOrder`, `createWorkOrder`, etc.

## Frontend Development Conventions

- **Mobile-first design:** Build UI mobile-first with responsive breakpoints for tablets and desktops; ensure all features are usable on touch devices
- **Component Library:** Use [shadcn/ui](https://ui.shadcn.com/) as the foundation for UI components
- **Adding components:** Always use the CLI (`npx shadcn@latest add <component>`) to add new shadcn/ui components—do not manually create or copy component files
- **Prefer reuse:** Before creating new UI elements, check for existing components that can be extended or composed
- **Component structure:** shadcn/ui primitives go in `components/ui/`; build domain-specific components in `components/features/`
- **Styling:** Use Tailwind CSS classes consistently; extend shadcn/ui component variants rather than duplicating styles

## Testing Conventions

### Coverage Requirements

- Minimum 80% line coverage enforced on both backend and frontend
- CI builds fail if coverage drops below threshold

### Backend Testing (pytest)

- Test files in `app/api/tests/` with `test_*.py` naming
- **Unit tests** in `tests/unit/` - test schemas, business logic without database
- **Integration tests** in `tests/integration/` - test API endpoints with test database
- Use factories (`tests/factories/`) for test data generation
- Run tests before committing changes to API code

### Frontend Testing (Vitest + Playwright)

- Test files in `app/ui/__tests__/` with `*.test.ts(x)` naming
- **Unit tests** for utilities and API client (`__tests__/unit/`)
- **Integration tests** for components (`__tests__/integration/`)
- **E2E tests** with Playwright (`__tests__/e2e/*.spec.ts`)
- Mock API calls using MSW (Mock Service Worker)
- Skip testing shadcn/ui primitives in `components/ui/` - focus on feature components

### What to Test

- **API endpoints:** request/response contracts, error handling, edge cases
- **CRUD operations:** database interactions, validation
- **Feature components:** user interactions, form submissions, data display
- **API client:** error handling, request formatting
- **E2E:** critical user workflows (create/edit/delete work orders)

## API SDK Generation

The frontend TypeScript API client is auto-generated from FastAPI's OpenAPI schema using **orval**.

**When to regenerate:**
- After adding/modifying FastAPI endpoints
- After changing Pydantic request/response schemas
- After adding new routers

**How to regenerate:**
```bash
make api-run      # Start FastAPI (in one terminal)
make api-generate # Generate TypeScript SDK (in another terminal)
```

**Files:**
- `app/ui/src/lib/api/generated/` - Generated API functions, SWR hooks, and types (committed to git)
- `app/ui/src/lib/api/custom-fetch.ts` - Custom fetch implementation with error handling
- `app/ui/orval.config.ts` - Generation configuration

**Important:** Always commit regenerated files when changing backend API contracts.

## Prerequisites

- Node.js + Yarn (UI)
- Python 3.12+ with UV (API)
- Docker (database migrations)
- Terraform (infrastructure)
- PostgreSQL instance with credentials in `database/.env`
