-- Migration: Add custom_id column to maintenance table
-- This adds support for human-readable IDs like MAN-A001, MAN-A002

-- Add custom_id to maintenance table
ALTER TABLE maintenance ADD COLUMN custom_id TEXT UNIQUE;

-- Create index for better performance on custom_id lookups
CREATE INDEX IF NOT EXISTS idx_maintenance_custom_id ON maintenance(custom_id);
