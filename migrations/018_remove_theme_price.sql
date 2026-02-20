-- Migration: Remove price column from themes table
-- Themes are only used to track which themes exist and their availability

ALTER TABLE themes DROP COLUMN price;
