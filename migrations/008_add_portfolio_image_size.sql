-- Migration: Add image_size column to portfolio_images table
-- This allows admins to choose the display size for each portfolio image

-- Add image_size column with default 'medium'
ALTER TABLE portfolio_images ADD COLUMN image_size TEXT DEFAULT 'medium';

-- Note: Valid values are 'small', 'medium', 'large'
-- small: h-48 (192px)
-- medium: h-64 (256px) - current default
-- large: h-80 (320px)
