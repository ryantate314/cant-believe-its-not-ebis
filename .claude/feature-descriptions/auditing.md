# Auditing & Changelog Infrastructure

## Overview

Implement a comprehensive auditing and changelog framework for Cirrus MRO that tracks all changes to entities across the system. This infrastructure must meet aviation regulatory standards (FAA, EASA) for maintenance record-keeping and compliance.

## Problem Statement

Aircraft maintenance organizations are required to maintain complete, tamper-evident records of all maintenance activities, part changes, and work order modifications. The system needs an auditing layer that:
- Captures every change to tracked entities
- Preserves the full history of modifications
- Supports compliance audits and investigations
- Provides non-repudiation (changes tied to authenticated users)

## Functional Requirements

### Core Audit Logging
- **Automatic capture**: Record all INSERT, UPDATE, and DELETE operations on audited tables
- **Change details**: Store old values, new values, and computed diffs for each change
- **Metadata**: Capture timestamp, user ID, session ID, IP address, and action type
- **Entity context**: Link audit records to the specific entity type and primary key

### Changelog Retrieval
- **Entity history API**: Retrieve complete change history for any audited entity
- **Filtering**: Support filtering by date range, user, and change type
- **Pagination**: Handle entities with extensive history efficiently
- **Diff display**: Provide human-readable field-level change summaries

### Immutability & Integrity
- **Append-only**: Audit records cannot be modified or deleted through the application
- **Tamper detection**: Consider checksums or hash chains to detect unauthorized modifications
- **Retention**: Support configurable retention policies per entity type

## Non-Functional Requirements

### Compliance Standards
- Meet FAA 14 CFR Part 43 record-keeping requirements
- Support EASA Part-145 documentation standards
- Enable traceability for AS9100D quality management audits

### Performance
- Audit logging must not significantly impact write operation latency
- Use asynchronous processing where appropriate
- Efficient indexing for common query patterns (by entity, by user, by date)

### Scalability
- Design for high-volume write environments
- Consider partitioning strategy for audit tables
- Plan for long-term data retention (7+ years for aviation records)

## Technical Approach

### Database Layer
- PostgreSQL audit table(s) with appropriate indexes
- Database triggers or application-level hooks for change capture
- JSONB columns for flexible old/new value storage

### API Layer
- FastAPI endpoints for changelog retrieval
- Middleware or decorators for capturing request context (user, IP)
- Standardized audit event schema

### Frontend (Future)
- Changelog component that can be embedded in any entity detail view
- Timeline visualization of changes
- User-friendly diff display

## Out of Scope (This Phase)

- UI components (infrastructure only)
- Specific entity implementations (framework only)
- Real-time audit notifications
- Audit log export/reporting tools

## Acceptance Criteria

- [ ] Audit table schema created with Flyway migration
- [ ] Mechanism to register entities for auditing
- [ ] Automatic change capture for registered entities
- [ ] API endpoint to retrieve entity changelog
- [ ] User context properly captured in audit records
- [ ] Unit and integration tests for audit functionality
- [ ] Documentation for adding auditing to new entities

## References

- FAA Advisory Circular 43-9C (Maintenance Records)
- EASA Part-145.A.55 (Maintenance Records)
- PostgreSQL Audit Trigger patterns
