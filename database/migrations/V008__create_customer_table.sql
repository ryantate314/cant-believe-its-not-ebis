-- V008: Customer table

CREATE TABLE customer (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(30),
    phone_type VARCHAR(20),
    address VARCHAR(200),
    address_2 VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    country VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on UUID for API lookups
CREATE INDEX idx_customer_uuid ON customer(uuid);

-- Index on name for searches
CREATE INDEX idx_customer_name ON customer(name);

-- Index on created_at for default sorting
CREATE INDEX idx_customer_created_at ON customer(created_at);
