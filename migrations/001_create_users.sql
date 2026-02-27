-- Migration 001: Create users table
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name    VARCHAR(50)  NOT NULL,
  last_name     VARCHAR(50)  NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_verified   BOOLEAN      DEFAULT false,
  avatar_url    VARCHAR(500),
  created_at    TIMESTAMP    DEFAULT NOW(),
  updated_at    TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
