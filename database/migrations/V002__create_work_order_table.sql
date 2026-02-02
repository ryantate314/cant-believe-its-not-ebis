-- V002: Work Order table

CREATE TABLE work_order (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    work_order_number VARCHAR(20) NOT NULL UNIQUE,
    sequence_number INTEGER NOT NULL,
    city_id INTEGER NOT NULL REFERENCES city(id),
    work_order_type work_order_type DEFAULT 'work_order',
    status work_order_status DEFAULT 'created',
    status_notes VARCHAR(255),

    -- Aircraft (denormalized for POC)
    aircraft_registration VARCHAR(20),
    aircraft_serial VARCHAR(50),
    aircraft_make VARCHAR(50),
    aircraft_model VARCHAR(50),
    aircraft_year INTEGER,

    -- Customer (denormalized for POC)
    customer_name VARCHAR(200),
    customer_po_number VARCHAR(50),

    -- Dates
    due_date DATE,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    completed_date TIMESTAMPTZ,

    -- Assignment
    lead_technician VARCHAR(100),
    sales_person VARCHAR(100),
    priority priority_level DEFAULT 'normal',

    -- Audit
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on UUID for API lookups
CREATE INDEX idx_work_order_uuid ON work_order(uuid);

-- Index on city_id for filtering
CREATE INDEX idx_work_order_city_id ON work_order(city_id);

-- Index on status for filtering
CREATE INDEX idx_work_order_status ON work_order(status);

-- Index on work order number for searches
CREATE INDEX idx_work_order_number ON work_order(work_order_number);
