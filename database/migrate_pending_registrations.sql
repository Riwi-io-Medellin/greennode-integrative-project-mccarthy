-- Migration: move verification logic out of app_user into pending_registrations
-- Run this once against the production/dev database.

-- 1. Create staging table for unverified registrations
CREATE TABLE IF NOT EXISTS pending_registrations (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    company_name    VARCHAR(255) NOT NULL,
    economic_sector VARCHAR(255),
    employee_count  INTEGER,
    password_hash   TEXT NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Drop verification columns from app_user (now handled by pending_registrations)
ALTER TABLE app_user DROP COLUMN IF EXISTS verification_code;
ALTER TABLE app_user DROP COLUMN IF EXISTS verification_expires_at;

-- 3. Ensure every existing row has email_verified = TRUE
--    (legacy unverified rows are orphaned data; mark them verified or delete as needed)
UPDATE app_user SET email_verified = TRUE WHERE email_verified IS NULL OR email_verified = FALSE;
