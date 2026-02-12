-- Migration 005: Add catalog visibility and kit support to reservations
-- Adds field to control which items appear in public catalog
-- Adds kit and quantity support to reservations

-- Add show_in_catalog field to items table
-- This controls whether an item appears in the public catalog
ALTER TABLE items ADD COLUMN show_in_catalog INTEGER DEFAULT 1;

-- Add kit_id to reservations (can be NULL if reserving individual items)
ALTER TABLE reservations ADD COLUMN kit_id INTEGER;

-- Add quantity to reservations (how many units of the item/kit)
ALTER TABLE reservations ADD COLUMN quantity INTEGER DEFAULT 1;

-- Add foreign key relationship
-- Note: In SQLite, foreign keys are checked at runtime if enabled
-- ALTER TABLE reservations ADD CONSTRAINT fk_reservations_kit
--   FOREIGN KEY (kit_id) REFERENCES kits(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_items_show_in_catalog ON items(show_in_catalog);
CREATE INDEX IF NOT EXISTS idx_reservations_kit_id ON reservations(kit_id);

-- Update existing items to show in catalog by default
UPDATE items SET show_in_catalog = 1 WHERE show_in_catalog IS NULL;
