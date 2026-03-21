-- Migration 024: Add catalog features (featured, promotion, new) and testimonials table

-- Add feature flags to items
ALTER TABLE items ADD COLUMN is_featured INTEGER DEFAULT 0;
ALTER TABLE items ADD COLUMN is_promotion INTEGER DEFAULT 0;
ALTER TABLE items ADD COLUMN original_price REAL;
ALTER TABLE items ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Add feature flags to kits
ALTER TABLE kits ADD COLUMN is_featured INTEGER DEFAULT 0;
ALTER TABLE kits ADD COLUMN is_promotion INTEGER DEFAULT 0;
ALTER TABLE kits ADD COLUMN original_price REAL;

-- Add feature flags to sweets
ALTER TABLE sweets ADD COLUMN is_featured INTEGER DEFAULT 0;
ALTER TABLE sweets ADD COLUMN is_promotion INTEGER DEFAULT 0;
ALTER TABLE sweets ADD COLUMN original_price REAL;

-- Add feature flags to designs
ALTER TABLE designs ADD COLUMN is_featured INTEGER DEFAULT 0;
ALTER TABLE designs ADD COLUMN is_promotion INTEGER DEFAULT 0;
ALTER TABLE designs ADD COLUMN original_price REAL;

-- Add feature flags to themes
ALTER TABLE themes ADD COLUMN is_featured INTEGER DEFAULT 0;
ALTER TABLE themes ADD COLUMN is_promotion INTEGER DEFAULT 0;
ALTER TABLE themes ADD COLUMN original_price REAL;

-- Create testimonials table
CREATE TABLE testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_items_featured ON items(is_featured);
CREATE INDEX idx_items_promotion ON items(is_promotion);
CREATE INDEX idx_kits_featured ON kits(is_featured);
CREATE INDEX idx_sweets_featured ON sweets(is_featured);
CREATE INDEX idx_testimonials_status ON testimonials(status);
