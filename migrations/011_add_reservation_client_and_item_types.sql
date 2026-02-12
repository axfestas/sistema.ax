-- Migration: Add client_id and sweet_id, design_id to reservations table
-- This allows linking reservations to client records and supports sweets/designs

ALTER TABLE reservations ADD COLUMN client_id INTEGER REFERENCES clients(id);
ALTER TABLE reservations ADD COLUMN sweet_id INTEGER REFERENCES sweets(id);
ALTER TABLE reservations ADD COLUMN design_id INTEGER REFERENCES designs(id);
