-- Migration 007: Create trips table

DO $$ BEGIN
  CREATE TYPE trip_status_enum AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN
    -- Enum already exists, add missing value if needed
    ALTER TYPE trip_status_enum ADD VALUE IF NOT EXISTS 'in_progress';
END $$;

CREATE TABLE IF NOT EXISTS trips (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  origin_name         VARCHAR(255) NOT NULL,
  origin_address      VARCHAR(500),
  origin_lat          DECIMAL(10,7) NOT NULL,
  origin_lng          DECIMAL(10,7) NOT NULL,
  destination_name    VARCHAR(255) NOT NULL,
  destination_address VARCHAR(500),
  destination_lat     DECIMAL(10,7) NOT NULL,
  destination_lng     DECIMAL(10,7) NOT NULL,
  scheduled_at        TIMESTAMPTZ,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  status              trip_status_enum NOT NULL DEFAULT 'scheduled',
  distance_km         DECIMAL(8,2),
  duration_min        INTEGER,
  note                VARCHAR(255),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trips_user_status ON trips(user_id, status);
