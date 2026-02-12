-- Migration: Add category field to items table
-- This allows inventory items to be organized by category

ALTER TABLE items ADD COLUMN category TEXT;
