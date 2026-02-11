-- Add default admin user alex.fraga@axfestas.com.br (idempotent)
-- Password: Ax7866Nb@
-- This migration is idempotent and safe to run multiple times

INSERT OR IGNORE INTO users (email, password_hash, name, role) 
VALUES (
  'alex.fraga@axfestas.com.br', 
  'b20c87122e7397ae12d9af93c6dacac9:125aa6d9b3ef0df48800ba7a0103c550b476afc38fa01ab012d6a6823bf06e82', 
  'Alex Fraga', 
  'admin'
);
