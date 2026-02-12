-- Migration: Add custom_id columns to items, kits, and reservations tables
-- This adds support for human-readable IDs like EST-A001, KIT-A001, RES-A001

-- Add custom_id to items table
ALTER TABLE items ADD COLUMN custom_id TEXT UNIQUE;

-- Add custom_id to kits table
ALTER TABLE kits ADD COLUMN custom_id TEXT UNIQUE;

-- Add custom_id to reservations table
ALTER TABLE reservations ADD COLUMN custom_id TEXT UNIQUE;

-- Create indices for better performance on custom_id lookups
CREATE INDEX IF NOT EXISTS idx_items_custom_id ON items(custom_id);
CREATE INDEX IF NOT EXISTS idx_kits_custom_id ON kits(custom_id);
CREATE INDEX IF NOT EXISTS idx_reservations_custom_id ON reservations(custom_id);
