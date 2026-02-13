-- Migration 014: Add active column to users table
-- 
-- Context: The schema.sql already defines the 'active' column,
-- but existing databases created before this addition don't have it.
-- This migration ensures all environments are synchronized.
--
-- IMPORTANT: This migration will error if the column already exists,
-- but this is safe and expected behavior. The error does not corrupt
-- data or affect the database - it simply means the migration was
-- already applied. SQLite does not support "IF NOT EXISTS" for ALTER TABLE.

BEGIN TRANSACTION;

-- Add active column with default value 1 (active)
-- If the column already exists, this will fail but not affect data
ALTER TABLE users ADD COLUMN active INTEGER DEFAULT 1;

-- Ensure all existing users are set to active
-- This UPDATE will work whether the column existed before or not
UPDATE users SET active = 1 WHERE active IS NULL;

COMMIT;
