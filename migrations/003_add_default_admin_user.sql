-- Add default admin user alex.fraga@axfestas.com.br (idempotent)
-- Default password: Ax7866Nb@
-- 
-- SECURITY WARNING:
-- This default admin user is included for initial setup convenience.
-- The password hash is the same across all deployments of this system.
-- You MUST change this password immediately after first login!
-- 
-- To change password after setup:
-- 1. Login with default credentials
-- 2. Go to admin panel and change password
-- OR run: node scripts/generate-password-hash.js "NewPassword"
--         and update the password_hash in the database
--
-- This migration is idempotent and safe to run multiple times

INSERT OR IGNORE INTO users (email, password_hash, name, role) 
VALUES (
  'alex.fraga@axfestas.com.br', 
  'b20c87122e7397ae12d9af93c6dacac9:125aa6d9b3ef0df48800ba7a0103c550b476afc38fa01ab012d6a6823bf06e82', 
  'Alex Fraga', 
  'admin'
);
