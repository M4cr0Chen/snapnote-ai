-- Manual Database Setup SQL
-- Run this as PostgreSQL superuser if the setup_database.sh script doesn't work
--
-- Usage:
--   sudo -u postgres psql -f setup_database_manual.sql

-- Configuration (change these if needed)
\set db_name 'snapnote'
\set db_user 'snapnote'
\set db_password '''password'''

-- Create user if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'snapnote') THEN
        CREATE USER snapnote WITH PASSWORD 'password';
        RAISE NOTICE 'User "snapnote" created';
    ELSE
        RAISE NOTICE 'User "snapnote" already exists';
    END IF;
END
$$;

-- Create database if not exists
SELECT 'CREATE DATABASE snapnote OWNER snapnote'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'snapnote')\gexec

-- Grant connection privilege
GRANT ALL PRIVILEGES ON DATABASE snapnote TO snapnote;

-- Connect to the database
\c snapnote

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO snapnote;
GRANT CREATE ON SCHEMA public TO snapnote;
ALTER SCHEMA public OWNER TO snapnote;

-- Grant default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO snapnote;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO snapnote;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO snapnote;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Verify setup
\echo ''
\echo '=========================================='
\echo 'Database setup completed!'
\echo '=========================================='
\echo ''
\echo 'Database: snapnote'
\echo 'User: snapnote'
\echo 'Password: password'
\echo ''
\echo 'DATABASE_URL:'
\echo 'postgresql://snapnote:password@localhost:5432/snapnote'
\echo ''
\echo 'To verify, run:'
\echo '  psql -U snapnote -d snapnote'
\echo ''
