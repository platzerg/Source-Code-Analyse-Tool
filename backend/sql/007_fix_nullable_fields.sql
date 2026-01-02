-- Fix: Make username field nullable in repositories table
ALTER TABLE repositories ALTER COLUMN username DROP NOT NULL;
