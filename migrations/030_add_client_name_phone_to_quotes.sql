-- Migration 030: Add client_name and client_phone columns to quotes
-- Allows creating quotes without requiring a registered client
ALTER TABLE quotes ADD COLUMN client_name TEXT;
ALTER TABLE quotes ADD COLUMN client_phone TEXT;

-- Backfill existing quotes with client name/phone from the clients table
UPDATE quotes
SET
  client_name = (SELECT name FROM clients WHERE clients.id = quotes.client_id),
  client_phone = (SELECT phone FROM clients WHERE clients.id = quotes.client_id)
WHERE client_id IS NOT NULL;
