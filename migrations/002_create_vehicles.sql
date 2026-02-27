-- Migration 002: Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  make          VARCHAR(50)  NOT NULL,
  model         VARCHAR(50)  NOT NULL,
  license_plate VARCHAR(20),
  created_at    TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
