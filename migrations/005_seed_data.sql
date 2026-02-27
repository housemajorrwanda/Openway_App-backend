-- Migration 005: Seed Kigali traffic locations and parking spots

-- Traffic Locations (Kigali, Rwanda)
INSERT INTO traffic_locations (name, level, latitude, longitude) VALUES
  ('Gisimenti',       'high',   -1.956,  30.0939),
  ('Sonatubes',       'medium', -1.974,  30.1044),
  ('Gishushu',        'low',    -1.954,  30.087),
  ('Kimironko',       'medium', -1.944,  30.103),
  ('Nyabugogo',       'high',   -1.942,  30.056),
  ('Downtown Kigali', 'medium', -1.950,  30.060)
ON CONFLICT DO NOTHING;

-- Parking Spots (Kigali, Rwanda)
INSERT INTO parking_spots (name, latitude, longitude, total_spots, open_spots, price_rwf) VALUES
  ('KBC Arena Parking',   -1.957, 30.092, 50, 24, 500),
  ('City Center Garage',  -1.953, 30.062, 40,  8, 700),
  ('Kicukiro Market Lot', -1.974, 30.104, 60, 35, 300),
  ('Remera Parking',      -1.948, 30.108, 80, 60, 400),
  ('Kimihurura Lot',      -1.942, 30.082, 30,  5, 600)
ON CONFLICT DO NOTHING;
