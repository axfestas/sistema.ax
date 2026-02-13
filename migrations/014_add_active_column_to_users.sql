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
-- SQLite's ALTER TABLE ADD COLUMN with DEFAULT automatically sets
-- the default value for all existing rows, so no UPDATE is needed.
-- If the column already exists, this will fail with "duplicate column name"
-- error, but this is safe and means the migration was already applied.
ALTER TABLE users ADD COLUMN active INTEGER DEFAULT 1;

COMMIT;
