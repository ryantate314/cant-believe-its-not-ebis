-- V005: Labor Kit tables for maintenance operation templates

-- Labor Kit table
CREATE TABLE labor_kit (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description VARCHAR(2000),
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,

    -- Audit
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on UUID for API lookups
CREATE INDEX idx_labor_kit_uuid ON labor_kit(uuid);

-- Index on category for filtering
CREATE INDEX idx_labor_kit_category ON labor_kit(category);

-- Index on is_active for filtering
CREATE INDEX idx_labor_kit_is_active ON labor_kit(is_active);

-- Labor Kit Item table (template items without status or work_order_id)
CREATE TABLE labor_kit_item (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    labor_kit_id INTEGER NOT NULL REFERENCES labor_kit(id) ON DELETE CASCADE,
    item_number INTEGER NOT NULL,
    discrepancy VARCHAR(4000),
    corrective_action VARCHAR(8000),
    notes VARCHAR(4000),
    category VARCHAR(100),
    sub_category VARCHAR(100),
    ata_code VARCHAR(20),
    hours_estimate DECIMAL(8,2),
    billing_method VARCHAR(20) DEFAULT 'hourly',
    flat_rate DECIMAL(10,2),
    department VARCHAR(50),
    do_not_bill BOOLEAN DEFAULT false,
    enable_rii BOOLEAN DEFAULT false,

    -- Audit
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure unique item numbers within a labor kit
    CONSTRAINT uq_labor_kit_item_number UNIQUE (labor_kit_id, item_number)
);

-- Index on UUID for API lookups
CREATE INDEX idx_labor_kit_item_uuid ON labor_kit_item(uuid);

-- Index on labor_kit_id for fetching items
CREATE INDEX idx_labor_kit_item_labor_kit_id ON labor_kit_item(labor_kit_id);
