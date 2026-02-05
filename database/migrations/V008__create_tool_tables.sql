-- V008: Tool tables for Tools Module

-- Tool type enum
CREATE TYPE tool_type AS ENUM ('certified', 'reference', 'consumable', 'kit');

-- Tool group enum (service status)
CREATE TYPE tool_group AS ENUM ('in_service', 'out_of_service', 'lost', 'retired');

-- Tool room table (tool storage locations within cities)
CREATE TABLE tool_room (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    city_id INTEGER NOT NULL REFERENCES city(id),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tool table (core tool inventory)
CREATE TABLE tool (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    tool_type tool_type NOT NULL,
    description VARCHAR(255),
    details VARCHAR(255),
    tool_room_id INTEGER NOT NULL REFERENCES tool_room(id),
    tool_group tool_group DEFAULT 'in_service',
    parent_kit_id INTEGER REFERENCES tool(id),
    make VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    location VARCHAR(100),
    location_notes VARCHAR(255),
    tool_cost DECIMAL(10,2),
    purchase_date DATE,
    date_labeled DATE,
    calibration_days INTEGER,
    calibration_notes VARCHAR(4000),
    calibration_cost DECIMAL(10,2),
    last_calibration_date DATE,
    next_calibration_due DATE,
    vendor_name VARCHAR(200),
    media_count INTEGER DEFAULT 0,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for tool_room
CREATE INDEX idx_tool_room_uuid ON tool_room(uuid);
CREATE INDEX idx_tool_room_city_id ON tool_room(city_id);

-- Indexes for tool
CREATE INDEX idx_tool_uuid ON tool(uuid);
CREATE INDEX idx_tool_tool_room_id ON tool(tool_room_id);
CREATE INDEX idx_tool_tool_type ON tool(tool_type);
CREATE INDEX idx_tool_parent_kit_id ON tool(parent_kit_id);
CREATE INDEX idx_tool_next_calibration_due ON tool(next_calibration_due);
CREATE INDEX idx_tool_name ON tool(name);
