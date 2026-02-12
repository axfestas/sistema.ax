-- Migration: Add client_id and sweet_id, design_id to reservations table
-- This allows linking reservations to client records and supports sweets/designs
-- Also makes item_id nullable since we now support multiple item types

-- Make item_id nullable (it's now optional since we have sweet_id and design_id)
-- Note: SQLite doesn't support ALTER COLUMN, so we keep it as-is
-- The validation is handled in the application layer

ALTER TABLE reservations ADD COLUMN client_id INTEGER REFERENCES clients(id);
ALTER TABLE reservations ADD COLUMN sweet_id INTEGER REFERENCES sweets(id);
ALTER TABLE reservations ADD COLUMN design_id INTEGER REFERENCES designs(id);
