-- Migration Down: Drop sample table
DROP INDEX IF EXISTS idx_samples_created_at;
DROP TABLE IF EXISTS samples;
