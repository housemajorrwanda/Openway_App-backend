/**
 * Seed script — run with: npx ts-node -r tsconfig-paths/register src/database/seed.ts
 *
 * Populates traffic_locations and parking_spots tables with Kigali data.
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { TrafficLocation } from './entities/traffic-location.entity';
import { ParkingSpot } from './entities/parking-spot.entity';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [TrafficLocation, ParkingSpot],
  synchronize: false,
  logging: true,
});

async function seed() {
  await dataSource.initialize();
  console.log('✅ Database connected');

  const trafficRepo = dataSource.getRepository(TrafficLocation);
  const parkingRepo = dataSource.getRepository(ParkingSpot);

  // ── Traffic Locations ──
  const trafficLocations = [
    // Original locations
    { name: 'Gisimenti',            level: 'high',   latitude: -1.9560, longitude: 30.0939 },
    { name: 'Sonatubes',            level: 'medium', latitude: -1.9740, longitude: 30.1044 },
    { name: 'Gishushu',             level: 'low',    latitude: -1.9540, longitude: 30.0870 },
    { name: 'Kimironko',            level: 'medium', latitude: -1.9440, longitude: 30.1030 },
    { name: 'Nyabugogo',            level: 'high',   latitude: -1.9420, longitude: 30.0560 },
    { name: 'Downtown Kigali',      level: 'medium', latitude: -1.9500, longitude: 30.0600 },
    // Additional Kigali hotspots
    { name: 'Remera',               level: 'high',   latitude: -1.9480, longitude: 30.1080 },
    { name: 'Kacyiru',              level: 'medium', latitude: -1.9380, longitude: 30.0820 },
    { name: 'Kimihurura',           level: 'low',    latitude: -1.9430, longitude: 30.0810 },
    { name: 'Kicukiro',             level: 'medium', latitude: -1.9780, longitude: 30.0980 },
    { name: 'Kanombe Junction',     level: 'high',   latitude: -1.9690, longitude: 30.1340 },
    { name: 'Airport Road',         level: 'medium', latitude: -1.9630, longitude: 30.1300 },
    { name: 'Kabuga',               level: 'low',    latitude: -1.9360, longitude: 30.1650 },
    { name: 'Gatsata',              level: 'medium', latitude: -1.9260, longitude: 30.0650 },
    { name: 'Muhima',               level: 'high',   latitude: -1.9520, longitude: 30.0540 },
    { name: 'Biryogo',              level: 'medium', latitude: -1.9560, longitude: 30.0530 },
    { name: 'Nyamirambo',           level: 'high',   latitude: -1.9680, longitude: 30.0490 },
    { name: 'Gitega',               level: 'low',    latitude: -1.9600, longitude: 30.0570 },
    { name: 'Masaka',               level: 'medium', latitude: -2.0020, longitude: 30.0790 },
    { name: 'Nyanza Road Junction', level: 'low',    latitude: -2.0100, longitude: 30.0720 },
    { name: 'Kibagabaga',           level: 'medium', latitude: -1.9340, longitude: 30.0990 },
    { name: 'Gaculiro',             level: 'low',    latitude: -1.9310, longitude: 30.0870 },
    { name: 'Rugando',              level: 'medium', latitude: -1.9390, longitude: 30.0950 },
    { name: 'Zindiro',              level: 'low',    latitude: -1.9290, longitude: 30.1160 },
    { name: 'Bugesera Road',        level: 'medium', latitude: -1.9990, longitude: 30.1200 },
  ];

  for (const loc of trafficLocations) {
    const existing = await trafficRepo.findOne({ where: { name: loc.name } });
    if (!existing) {
      await trafficRepo.save(trafficRepo.create(loc as any));
      console.log(`  🟢 Seeded traffic: ${loc.name}`);
    } else {
      console.log(`  ⏭️  Already exists: ${loc.name}`);
    }
  }

  // ── Parking Spots ──
  const parkingSpots = [
    { name: 'KBC Arena Parking',   latitude: -1.957, longitude: 30.092, totalSpots: 50, openSpots: 24, priceRwf: 500 },
    { name: 'City Center Garage',  latitude: -1.953, longitude: 30.062, totalSpots: 40, openSpots:  8, priceRwf: 700 },
    { name: 'Kicukiro Market Lot', latitude: -1.974, longitude: 30.104, totalSpots: 60, openSpots: 35, priceRwf: 300 },
    { name: 'Remera Parking',      latitude: -1.948, longitude: 30.108, totalSpots: 80, openSpots: 60, priceRwf: 400 },
    { name: 'Kimihurura Lot',      latitude: -1.942, longitude: 30.082, totalSpots: 30, openSpots:  5, priceRwf: 600 },
  ];

  for (const spot of parkingSpots) {
    const existing = await parkingRepo.findOne({ where: { name: spot.name } });
    if (!existing) {
      await parkingRepo.save(parkingRepo.create(spot));
      console.log(`  🅿️  Seeded parking: ${spot.name}`);
    } else {
      console.log(`  ⏭️  Already exists: ${spot.name}`);
    }
  }

  console.log('\n✅ Seeding complete!');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
