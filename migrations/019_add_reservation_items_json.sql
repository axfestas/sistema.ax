-- Migration 019: Allow multiple items per reservation
-- Adds items_json column to store a JSON array of selected items.
-- Each element: {"itemKey":"item:3","quantity":1,"displayName":"[Estoque] Mesa"}
-- Existing single-item reservations are unaffected (column is nullable).

ALTER TABLE reservations ADD COLUMN items_json TEXT;
