-- V001: Reference tables and enums for Work Order module

-- City table (multi-tenant scoping)
CREATE TABLE city (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Order status enum
CREATE TYPE work_order_status AS ENUM (
    'created',
    'scheduled',
    'open',
    'in_progress',
    'tracking',
    'pending',
    'in_review',
    'completed',
    'void'
);

-- Work Order Item status enum
CREATE TYPE work_order_item_status AS ENUM (
    'open',
    'waiting_for_parts',
    'in_progress',
    'tech_review',
    'admin_review',
    'finished'
);

-- Priority level enum
CREATE TYPE priority_level AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
);

-- Work Order type enum
CREATE TYPE work_order_type AS ENUM (
    'work_order',
    'quote'
);

-- Index for city lookups by UUID
CREATE INDEX idx_city_uuid ON city(uuid);
