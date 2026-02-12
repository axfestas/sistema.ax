-- Migration: Add custom_id columns to items, kits, and reservations tables
-- This adds support for human-readable IDs like EST-A001, KIT-A001, RES-A001

-- Add custom_id to items table
ALTER TABLE items ADD COLUMN custom_id TEXT UNIQUE;

-- Add custom_id to kits table
ALTER TABLE kits ADD COLUMN custom_id TEXT UNIQUE;

-- Add custom_id to reservations table
ALTER TABLE reservations ADD COLUMN custom_id TEXT UNIQUE;

-- Note: Indices for custom_id columns are defined in schema.sql
-- They will be created when running the full schema initialization
