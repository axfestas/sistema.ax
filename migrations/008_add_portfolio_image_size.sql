-- Migration: Add image_size column to portfolio_images table
-- This allows admins to choose the display format for each portfolio image
-- based on aspect ratios commonly used in social media

-- Add image_size column with default 'feed-square'
ALTER TABLE portfolio_images ADD COLUMN image_size TEXT DEFAULT 'feed-square';

-- Note: Valid values are based on aspect ratios:
-- 'feed-vertical': Feed vertical (4:5 aspect ratio) - h-80 (320px)
-- 'feed-square': Feed square (1:1 aspect ratio) - h-64 (256px) - default
-- 'story': Stories/Reels (9:16 aspect ratio) - h-96 (384px)
-- 'profile': Profile photo (1:1 aspect ratio, smaller) - h-48 (192px)
--
-- Backward compatibility maintained with old values:
-- 'small' = h-48 (192px)
-- 'medium' = h-64 (256px)
-- 'large' = h-80 (320px)
