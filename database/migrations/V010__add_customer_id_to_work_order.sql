-- V010: Add customer_id FK to work_order, drop denormalized customer fields

-- Step 1: Add nullable customer_id column
ALTER TABLE work_order ADD COLUMN customer_id INTEGER;

-- Step 2: Add FK constraint (nullable — not all WOs have a customer)
ALTER TABLE work_order ADD CONSTRAINT fk_work_order_customer
    FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE SET NULL;

-- Step 3: Create index
CREATE INDEX idx_work_order_customer_id ON work_order(customer_id);

-- Step 4: Drop denormalized customer fields from work_order
ALTER TABLE work_order DROP COLUMN customer_name;
ALTER TABLE work_order DROP COLUMN customer_po_number;

-- Step 5: Drop denormalized customer_name from aircraft
ALTER TABLE aircraft DROP COLUMN customer_name;
