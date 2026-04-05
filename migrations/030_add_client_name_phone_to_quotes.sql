-- Migration 030: Add client_name and client_phone columns to quotes
-- Allows creating quotes without requiring a registered client
ALTER TABLE quotes ADD COLUMN client_name TEXT;
ALTER TABLE quotes ADD COLUMN client_phone TEXT;
