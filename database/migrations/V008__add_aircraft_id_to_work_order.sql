-- Step 1: Create Aircraft records from existing work orders (if any have aircraft data)
DELETE FROM work_order
WHERE aircraft_registration IS NULL
  OR aircraft_registration = '';

INSERT INTO aircraft (uuid, registration_number, serial_number, make, model, year_built, is_active, created_by, created_at, updated_at)
SELECT DISTINCT gen_random_uuid(), wo.aircraft_registration, wo.aircraft_serial, wo.aircraft_make, wo.aircraft_model, wo.aircraft_year, TRUE, 'migration', NOW(), NOW()
FROM work_order wo
WHERE wo.aircraft_registration IS NOT NULL AND wo.aircraft_registration != ''
  AND NOT EXISTS (SELECT 1 FROM aircraft a WHERE a.registration_number = wo.aircraft_registration);

-- Step 2: Add aircraft_id column (nullable first for backfill)
ALTER TABLE work_order ADD COLUMN aircraft_id INTEGER;

-- Step 3: Backfill aircraft_id from existing data
UPDATE work_order wo SET aircraft_id = a.id
FROM aircraft a WHERE wo.aircraft_registration = a.registration_number;

-- Step 4: Make aircraft_id NOT NULL and add foreign key constraint
ALTER TABLE work_order ALTER COLUMN aircraft_id SET NOT NULL;
ALTER TABLE work_order ADD CONSTRAINT fk_work_order_aircraft FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) ON DELETE RESTRICT;

-- Step 5: Create index
CREATE INDEX idx_work_order_aircraft_id ON work_order(aircraft_id);

-- Step 6: Remove denormalized fields
ALTER TABLE work_order
  DROP COLUMN aircraft_registration,
  DROP COLUMN aircraft_serial,
  DROP COLUMN aircraft_make,
  DROP COLUMN aircraft_model,
  DROP COLUMN aircraft_year;
