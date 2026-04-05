-- Migration 031: Add caption column to publicacoes
-- Moves "Legenda / Texto para publicação" from artes_criadas to publicacoes
ALTER TABLE publicacoes ADD COLUMN caption TEXT;
