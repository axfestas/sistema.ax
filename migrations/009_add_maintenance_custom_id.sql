-- Migration: Add custom_id column to maintenance table
-- This adds support for human-readable IDs like MAN-A001, MAN-A002

-- Add custom_id to maintenance table
ALTER TABLE maintenance ADD COLUMN custom_id TEXT UNIQUE;

-- Note: Index for custom_id column will be defined in schema.sql
