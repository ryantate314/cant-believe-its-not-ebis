-- V009: Aircraft-Customer join table (many-to-many with primary designation)

CREATE TABLE aircraft_customer (
    id SERIAL PRIMARY KEY,
    aircraft_id INTEGER NOT NULL REFERENCES aircraft(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customer(id) ON DELETE RESTRICT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    -- Audit
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure unique pairing
    CONSTRAINT uq_aircraft_customer UNIQUE (aircraft_id, customer_id)
);

CREATE INDEX idx_aircraft_customer_aircraft_id ON aircraft_customer(aircraft_id);
CREATE INDEX idx_aircraft_customer_customer_id ON aircraft_customer(customer_id);
