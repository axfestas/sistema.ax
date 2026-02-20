-- Migration 017: Add payment fields and total amount to reservations
-- Adds: total_amount, payment_type, payment_receipt_url, contract_url

ALTER TABLE reservations ADD COLUMN total_amount REAL;
ALTER TABLE reservations ADD COLUMN payment_type TEXT;
ALTER TABLE reservations ADD COLUMN payment_receipt_url TEXT;
ALTER TABLE reservations ADD COLUMN contract_url TEXT;
