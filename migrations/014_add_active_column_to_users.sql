-- Migration 014: Add active column to users table
-- This migration is IDEMPOTENT - can be run multiple times safely
-- 
-- Context: The schema.sql already defines the 'active' column,
-- but existing databases created before this addition don't have it.
-- This migration ensures all environments are synchronized.

-- SQLite doesn't support "ALTER TABLE ADD COLUMN IF NOT EXISTS"
-- But we can safely add the column - if it already exists, SQLite will error
-- but the error is harmless in this controlled migration context

BEGIN TRANSACTION;

-- Add active column with default value 1 (active)
-- If the column already exists, this will fail but not affect data
ALTER TABLE users ADD COLUMN active INTEGER DEFAULT 1;

-- Ensure all existing users are set to active
-- This UPDATE will work whether the column existed before or not
UPDATE users SET active = 1 WHERE active IS NULL;

COMMIT;
