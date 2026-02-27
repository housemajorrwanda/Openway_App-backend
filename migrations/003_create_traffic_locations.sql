-- Migration 003: Create traffic_locations table
CREATE TABLE IF NOT EXISTS traffic_locations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  level      VARCHAR(10)  CHECK (level IN ('low','medium','high')),
  latitude   DOUBLE PRECISION NOT NULL,
  longitude  DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
