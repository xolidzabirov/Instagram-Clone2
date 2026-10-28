-- Alternative setup: create the role and databases inside an EXISTING PostgreSQL server.
-- Default setup is `pnpm --filter @ig/api db:local init` (separate cluster on port 5434).
-- Run as a superuser:  psql -h localhost -p 5433 -U postgres -f apps/api/scripts/create-local-db.sql
-- CREATEDB is needed by `prisma migrate dev` for its temporary shadow database.

SELECT 'CREATE ROLE instagram LOGIN CREATEDB PASSWORD ''instagram_dev'''
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'instagram')\gexec

SELECT 'CREATE DATABASE instagram OWNER instagram'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'instagram')\gexec

SELECT 'CREATE DATABASE instagram_test OWNER instagram'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'instagram_test')\gexec
