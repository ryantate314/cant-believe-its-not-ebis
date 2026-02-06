# Customer Management

## Problem Statement

Cirrus MRO currently stores customer information as denormalized text fields (`customer_name`) on aircraft and work order records. This means there is no single source of truth for customer data — the same customer may be spelled differently across records, there's no way to view all aircraft or work orders for a customer, and customer contact/billing details have nowhere to live. This blocks future billing, invoicing, and CRM workflows.

## Evidence

- The existing database migration V002 explicitly notes "Customer (denormalized for POC)" — this was always intended to be normalized
- The legacy EBIS system has a full Customers module with 3,900+ customer records, proving the need
- Aircraft detail pages in EBIS have a "Customers" tab showing linked customers with primary designation
- Work order config shows a readonly "Customer" lookup field populated from aircraft

## Proposed Solution

Create a Customer entity as a first-class resource with full CRUD operations. Link customers to aircraft via a many-to-many join table (`aircraft_customer`) with a `is_primary` flag. When a work order is created, the primary customer from the selected aircraft is automatically linked to the work order. For v1, focus on the CRUD infrastructure, the aircraft-customer relationship, and work order linkage — deferring billing profiles, tax overrides, and advanced features.

## Key Hypothesis

We believe normalizing customer data and linking it to aircraft and work orders will give MRO staff a single source of truth for customer information.
We'll know we're right when customers can be created, linked to aircraft, and automatically associated with new work orders.

## What We're NOT Building

- **Billing profiles/overrides** — complex billing configuration deferred to a later phase
- **Tax overrides** — tax exemption management deferred
- **Additional addresses** — multiple shipping/billing addresses deferred
- **Customer reports** — AR aging, payment history, customer record reports deferred
- **Advanced search (44 filters)** — basic search only for v1
- **Notification notes / popup alerts** — deferred
- **Customer portal / login** — out of scope entirely
- **Data migration from existing `customer_name` fields** — starting fresh

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Customer CRUD functional | All operations work end-to-end | Integration tests pass |
| Aircraft-customer linkage | Many-to-many with primary designation | Integration tests pass |
| Work order auto-linking | Primary customer copied on WO creation | Integration tests pass |
| Test coverage | >= 80% line coverage | pytest + vitest coverage reports |

## Open Questions

- [x] ~~Should the work order `customer_name` and `customer_po_number` columns be dropped or kept alongside the new FK?~~ **Decision: Drop them.** Migration will remove `customer_name` from both `aircraft` and `work_order` tables, and `customer_po_number` from `work_order`.
- [x] ~~Will customer records be scoped to a city, or are they global across all cities?~~ **Decision: Global.** Customers are created at the root level and can be used by any service center.
- [x] ~~Should the customer list page be a top-level nav item or nested under an admin section?~~ **Decision: Top-level user-facing nav item.**

---

## Users & Context

**Primary User**
- **Who**: MRO service writers and front desk staff who create work orders and manage aircraft records
- **Current behavior**: Manually typing customer names as free text on aircraft and work order records
- **Trigger**: Creating a new work order or registering a new aircraft — needs to associate a customer
- **Success state**: Select a customer from a list; customer auto-populates on work orders via aircraft linkage

**Job to Be Done**
When I'm creating a work order for an aircraft, I want the customer to be automatically filled in from the aircraft record, so I can avoid manual entry errors and have a consistent customer reference across all records.

**Non-Users**
End customers / aircraft owners are NOT users of this system. This is purely for MRO internal staff.

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | Customer CRUD (create, read, update, delete) | Foundation for all customer features |
| Must | Customer list page with search and pagination | Staff need to find and manage customers |
| Must | Aircraft-customer many-to-many linkage with primary flag | Core relationship model per requirements |
| Must | Work order auto-links primary aircraft customer on creation | Key workflow automation |
| Must | Customer detail page with contact info fields | Need somewhere to view/edit customer data |
| Should | Customer selector on aircraft form | Allow linking customers when editing aircraft |
| Should | Customer display on work order list/detail | Visible customer info from normalized source |
| Could | Customer tab on aircraft detail page | View linked customers from aircraft context |
| Won't | Billing overrides, tax overrides, addresses | Deferred to future phase |
| Won't | Advanced search filters | Basic name search sufficient for v1 |
| Won't | Customer reports | Deferred to future phase |

### MVP Scope

1. **Customer table** with core contact fields (name, email, phone, address, city, state, zip, notes)
2. **Aircraft-customer join table** with `is_primary` flag
3. **Customer API endpoints** (list, create, get, update, delete)
4. **Aircraft-customer API endpoints** (link, unlink, set primary)
5. **Customer list page** with search and pagination
6. **Customer detail/edit page** with contact info
7. **Work order creation** auto-links primary customer from aircraft
8. **Backend + frontend tests** at 80% coverage

### User Flow

1. Staff navigates to Customers list -> clicks "Add Customer" -> enters name + contact info -> saves
2. Staff navigates to Aircraft detail -> links one or more customers -> designates one as primary
3. Staff creates a new Work Order for an aircraft -> primary customer is auto-populated
4. Staff can view customer info on work order detail

---

## Technical Approach

**Feasibility**: HIGH

The codebase has well-established patterns for CRUD entities (aircraft, work orders, labor kits). The customer entity follows the exact same pattern — SQLAlchemy model, Pydantic schemas, FastAPI router, Next.js API proxy, React pages. The many-to-many join table is the only new pattern, and SQLAlchemy handles this natively.

**Architecture Notes**
- New `customer` table following existing patterns (uuid, audit fields, indexes)
- New `aircraft_customer` join table with `is_primary` boolean and composite unique constraint
- New `customer_id` FK on `work_order` table (nullable)
- Drop denormalized `customer_name` from `aircraft` and `work_order` tables, drop `customer_po_number` from `work_order`
- Customers are global (no city scoping) — any service center can use any customer
- Frontend follows existing patterns: API client module, server components with Suspense, shadcn/ui

**Technical Risks**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Join table complexity in queries | Low | SQLAlchemy relationships handle this well; existing patterns to follow |
| Breaking existing work order creation flow | Medium | Drop old columns in same migration that adds customer_id FK; update all references in API + frontend |
| Frontend form complexity for aircraft-customer linking | Low | Can use existing combobox/search patterns from shadcn/ui |

---

## Implementation Phases

<!--
  STATUS: pending | in-progress | complete
  PARALLEL: phases that can run concurrently (e.g., "with 3" or "-")
  DEPENDS: phases that must complete first (e.g., "1, 2" or "-")
  PRP: link to generated plan file once created
-->

| # | Phase | Description | Status | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|----------|---------|----------|
| 1 | Database & API - Customer CRUD | Customer table migration, SQLAlchemy model, Pydantic schemas, FastAPI CRUD endpoints with tests | complete | - | - | [customer-crud-api.plan.md](../plans/completed/customer-crud-api.plan.md) |
| 2 | Database & API - Relationships | Aircraft-customer join table, relationship endpoints, work order auto-link on creation, tests | complete | - | 1 | [customer-relationships-api.plan.md](../plans/completed/customer-relationships-api.plan.md) |
| 3 | Frontend - Customer List & Detail | Customer list page, detail/edit page, API client, Next.js proxy routes, frontend tests | complete | - | 1 | [customer-frontend-list-detail.plan.md](../plans/completed/customer-frontend-list-detail.plan.md) |
| 4 | Frontend - Relationship UI | Aircraft-customer linking UI, customer display on work orders, frontend tests | pending | - | 2, 3 | - |

### Phase Details

**Phase 1: Database & API - Customer CRUD**
- **Goal**: Establish the customer entity as a first-class backend resource
- **Scope**:
  - Flyway migration: `customer` table (id, uuid, name, email, phone, phone_type, address, address_2, city, state, zip, country, notes, audit fields) — no city FK, customers are global
  - SQLAlchemy model: `Customer` with relationships
  - Pydantic schemas: `CustomerCreate`, `CustomerUpdate`, `CustomerResponse`, `CustomerListResponse`
  - CRUD module: list (with search, pagination, sorting), create, get, update, delete
  - FastAPI router: `/api/v1/customers`
  - Integration + unit tests (80% coverage)
- **Success signal**: All customer CRUD endpoints pass integration tests

**Phase 2: Database & API - Relationships**
- **Goal**: Link customers to aircraft and auto-populate on work orders
- **Scope**:
  - Flyway migration: `aircraft_customer` join table (aircraft_id, customer_id, is_primary, audit fields)
  - Flyway migration: Add `customer_id` FK to `work_order` table (nullable), drop `customer_name` and `customer_po_number` from `work_order`, drop `customer_name` from `aircraft`
  - SQLAlchemy relationships on Aircraft, Customer, WorkOrder models
  - Update Aircraft and WorkOrder models/schemas to remove old denormalized fields
  - API endpoints: link/unlink customer to aircraft, set primary, list aircraft customers
  - Update work order creation to auto-link primary customer from aircraft
  - Update aircraft/work order response schemas to include customer info
  - Update existing tests that reference `customer_name` / `customer_po_number`
  - Integration + unit tests
- **Success signal**: Creating a work order for an aircraft with a primary customer auto-populates customer_id

**Phase 3: Frontend - Customer List & Detail**
- **Goal**: Staff can view, create, edit, and delete customers from the UI
- **Scope**:
  - TypeScript types for Customer
  - API client module (`lib/api/customers.ts`)
  - Next.js API proxy routes (`app/api/customers/`)
  - Customer list page with search, pagination, sorting (shadcn Table)
  - Customer create/edit form (shadcn Form components)
  - Customer detail page
  - Navigation link in sidebar/header
  - Vitest integration tests + MSW mocks
- **Success signal**: Full customer CRUD workflow functional in browser

**Phase 4: Frontend - Relationship UI**
- **Goal**: Staff can link customers to aircraft and see customer info on work orders
- **Scope**:
  - Aircraft detail: customer linking UI (add/remove customers, set primary)
  - Work order form: display auto-populated customer (readonly from aircraft)
  - Work order list: show customer name column from normalized source
  - Update existing aircraft and work order components
  - Vitest integration tests
- **Success signal**: End-to-end flow works: create customer -> link to aircraft -> create WO -> customer auto-populated

### Parallelism Notes

Phases 1 and 2 are sequential (2 depends on 1's customer table). Phase 3 can start as soon as Phase 1 is complete (only needs customer CRUD endpoints). Phase 4 requires both Phase 2 (relationship API) and Phase 3 (frontend foundation) to be complete.

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Customer-aircraft relationship | Many-to-many join table with `is_primary` flag | Single FK on aircraft, separate ownership table | Matches EBIS data model; one aircraft can have multiple customers (co-owners, management companies) |
| Work order customer linkage | FK to customer table + auto-populate from aircraft primary | Keep denormalized text field | Enables proper relational queries; auto-populate reduces manual entry |
| Existing `customer_name` fields | Drop in migration | Keep for backward compatibility | Clean break; no stale denormalized data to maintain |
| Customer scoping | Global (no city FK) | Scoped per city | Customers work across service centers; simpler model |
| Customer list placement | Top-level user-facing nav | Admin section | Frequently accessed by all staff, not just admins |
| Customer fields for v1 | Core contact info only (name, email, phone, address) | Full EBIS field set (billing profiles, tax, 44 search filters) | MVP scope — billing/tax deferred to keep scope manageable |
| Data migration | Start fresh (no migration of existing text data) | Auto-create customer records from existing `customer_name` values | User preference; avoids deduplication complexity |

---

## Research Summary

**Market Context**
MRO management systems (like the legacy EBIS being replaced) universally treat customers as a first-class entity. Customer records are the hub connecting aircraft ownership, work order billing, parts sales, and compliance tracking. This is table-stakes functionality for any MRO shop management system.

**Technical Context**
- Codebase has mature patterns for CRUD entities — model, schema, CRUD, router, tests
- Existing denormalized `customer_name` on aircraft and work_order tables confirms the POC nature
- SQLAlchemy async + FastAPI patterns well-established; adding a new entity is low-risk
- Frontend uses Next.js App Router with server components, shadcn/ui, and a consistent API client pattern
- 80% test coverage enforced on both backend and frontend

---

*Generated: 2026-02-05*
*Status: DRAFT - needs validation*
