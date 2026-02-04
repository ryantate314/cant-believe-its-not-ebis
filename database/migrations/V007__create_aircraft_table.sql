-- V006: Aircraft table

CREATE TABLE aircraft (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    registration_number VARCHAR(20) NOT NULL UNIQUE,
    serial_number VARCHAR(50),
    make VARCHAR(50),
    model VARCHAR(50),
    year_built INTEGER,
    meter_profile TEXT,
    primary_city_id INTEGER REFERENCES city(id),
    customer_name VARCHAR(200),
    aircraft_class VARCHAR(50),
    fuel_code VARCHAR(20),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on UUID for API lookups
CREATE INDEX idx_aircraft_uuid ON aircraft(uuid);

-- Index on registration_number for searches
CREATE INDEX idx_aircraft_registration_number ON aircraft(registration_number);

-- Index on primary_city_id for filtering
CREATE INDEX idx_aircraft_primary_city_id ON aircraft(primary_city_id);
