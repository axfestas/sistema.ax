-- Migration: Add quantidade_cartela to designs table
-- Adds a field to store the number of cards (cartelas) included in a design package

ALTER TABLE designs ADD COLUMN quantidade_cartela INTEGER DEFAULT 0;
