-- Migration 006: Add User Management Fields and Password Reset
-- Adds fields for user management (active status, phone)
-- Adds password reset tokens table
-- Updates reservations table with additional fields

-- Add active and phone fields to users table
ALTER TABLE users ADD COLUMN active INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN phone TEXT;

-- Add additional fields to reservations table
ALTER TABLE reservations ADD COLUMN reservation_type TEXT NOT NULL DEFAULT 'unit';
ALTER TABLE reservations ADD COLUMN customer_phone TEXT;
ALTER TABLE reservations ADD COLUMN notes TEXT;
ALTER TABLE reservations ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE reservations ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Add image_url to items table if not exists
ALTER TABLE items ADD COLUMN image_url TEXT;

-- Add image_url to kits table if not exists
ALTER TABLE kits ADD COLUMN image_url TEXT;

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create additional indices for better performance
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(date_from, date_to);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- Update existing reservations to have the default reservation_type
UPDATE reservations SET reservation_type = 'unit' WHERE reservation_type IS NULL;
