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
    { name: 'Gisimenti',       level: 'high',   latitude: -1.956, longitude: 30.0939 },
    { name: 'Sonatubes',       level: 'medium', latitude: -1.974, longitude: 30.1044 },
    { name: 'Gishushu',        level: 'low',    latitude: -1.954, longitude: 30.087  },
    { name: 'Kimironko',       level: 'medium', latitude: -1.944, longitude: 30.103  },
    { name: 'Nyabugogo',       level: 'high',   latitude: -1.942, longitude: 30.056  },
    { name: 'Downtown Kigali', level: 'medium', latitude: -1.950, longitude: 30.060  },
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
