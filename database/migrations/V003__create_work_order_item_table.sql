-- V003: Work Order Item table

CREATE TABLE work_order_item (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    work_order_id INTEGER NOT NULL REFERENCES work_order(id) ON DELETE CASCADE,
    item_number INTEGER NOT NULL,
    status work_order_item_status DEFAULT 'open',
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

    -- Ensure unique item numbers within a work order
    CONSTRAINT uq_work_order_item_number UNIQUE (work_order_id, item_number)
);

-- Index on UUID for API lookups
CREATE INDEX idx_work_order_item_uuid ON work_order_item(uuid);

-- Index on work_order_id for fetching items
CREATE INDEX idx_work_order_item_work_order_id ON work_order_item(work_order_id);

-- Index on status for filtering
CREATE INDEX idx_work_order_item_status ON work_order_item(status);
