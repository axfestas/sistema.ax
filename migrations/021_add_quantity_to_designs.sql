-- Migration: Add quantity to designs table
-- Adds a stock quantity field to track how many units of each design are available

ALTER TABLE designs ADD COLUMN quantity INTEGER NOT NULL DEFAULT 0;
