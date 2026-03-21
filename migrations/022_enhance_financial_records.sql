-- Migration 022: Enhance financial_records table
-- Adds category, payment_method, status and receipt_url columns
-- Also extends type to support 'purchase' (no schema change needed - type is TEXT)

ALTER TABLE financial_records ADD COLUMN category TEXT;
ALTER TABLE financial_records ADD COLUMN payment_method TEXT;
ALTER TABLE financial_records ADD COLUMN status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending'));
ALTER TABLE financial_records ADD COLUMN receipt_url TEXT;
