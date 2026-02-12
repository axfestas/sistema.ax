-- Migration: Add reservation_requests table
-- This table stores reservation requests submitted from the cart
-- before they are converted to actual reservations

CREATE TABLE IF NOT EXISTS reservation_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_id TEXT UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  event_date DATE NOT NULL,
  message TEXT,
  items_json TEXT NOT NULL, -- JSON array of cart items
  total_amount REAL NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'contacted', 'converted', 'cancelled'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reservation_requests_status ON reservation_requests(status);
CREATE INDEX IF NOT EXISTS idx_reservation_requests_created_at ON reservation_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_reservation_requests_custom_id ON reservation_requests(custom_id);
