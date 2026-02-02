-- V005: Audit log table for immutable change tracking

-- =============================================================================
-- AUDIT ACTION ENUM
-- =============================================================================

-- Audit action type enum
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- =============================================================================
-- AUDIT LOG TABLE
-- =============================================================================

-- Audit log table
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action audit_action NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id VARCHAR(100),
    session_id VARCHAR(100),
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments for documentation
COMMENT ON TABLE audit_log IS 'Immutable audit trail for entity changes';
COMMENT ON COLUMN audit_log.entity_type IS 'Table/entity name (e.g., work_order)';
COMMENT ON COLUMN audit_log.entity_id IS 'UUID of the entity being audited';
COMMENT ON COLUMN audit_log.action IS 'Type of mutation: INSERT, UPDATE, DELETE';
COMMENT ON COLUMN audit_log.old_values IS 'JSONB snapshot before mutation (NULL for INSERT)';
COMMENT ON COLUMN audit_log.new_values IS 'JSONB snapshot after mutation (NULL for DELETE)';
COMMENT ON COLUMN audit_log.changed_fields IS 'Array of field names that changed (UPDATE only)';
COMMENT ON COLUMN audit_log.user_id IS 'User who performed the action';
COMMENT ON COLUMN audit_log.session_id IS 'Session/request identifier';
COMMENT ON COLUMN audit_log.ip_address IS 'Client IP address';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Composite index for entity history lookups (most common query)
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- Index for time-based queries and pagination
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- Index for user-based filtering
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id) WHERE user_id IS NOT NULL;

-- GIN index for JSONB queries (if needed for field-level searches)
CREATE INDEX idx_audit_log_new_values ON audit_log USING GIN (new_values);

-- =============================================================================
-- IMMUTABILITY PROTECTION
-- =============================================================================

-- Function to prevent modifications to audit records
CREATE OR REPLACE FUNCTION audit_log_protect()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit log records cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce immutability
CREATE TRIGGER audit_log_immutable
    BEFORE UPDATE OR DELETE ON audit_log
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_protect();
