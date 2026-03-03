-- Migration 008: Create places table (search history + favourites)

DO $$ BEGIN
  CREATE TYPE place_type_enum AS ENUM ('search', 'favourite');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS places (
  id         UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(255)    NOT NULL,
  address    VARCHAR(500),
  latitude   DECIMAL(10,7)   NOT NULL,
  longitude  DECIMAL(10,7)   NOT NULL,
  type       place_type_enum NOT NULL DEFAULT 'search',
  created_at TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_places_user_type ON places(user_id, type);
