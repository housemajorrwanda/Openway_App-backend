-- Migration 004: Create parking_spots table
CREATE TABLE IF NOT EXISTS parking_spots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100)     NOT NULL,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  total_spots INTEGER          NOT NULL,
  open_spots  INTEGER          NOT NULL,
  price_rwf   INTEGER          NOT NULL,
  updated_at  TIMESTAMP        DEFAULT NOW()
);
