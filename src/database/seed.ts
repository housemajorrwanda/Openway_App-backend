/**
 * Seed script — run with: npx ts-node -r tsconfig-paths/register src/database/seed.ts
 *
 * Populates traffic_locations and parking_spots tables with Kigali data.
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { TrafficLocation } from './entities/traffic-location.entity';
import { ParkingSpot } from './entities/parking-spot.entity';
import { PointOfInterest } from './entities/point-of-interest.entity';
import { User } from './entities/user.entity';
import { Vehicle } from './entities/vehicle.entity';
import { FamilyContact } from './entities/family-contact.entity';
import { Insurance } from './entities/insurance.entity';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    TrafficLocation,
    ParkingSpot,
    PointOfInterest,
    User,
    Vehicle,
    FamilyContact,
    Insurance,
  ],
  synchronize: false,
  logging: true,
});

async function seed() {
  await dataSource.initialize();
  console.log('Database connected');

  const trafficRepo = dataSource.getRepository(TrafficLocation);
  const parkingRepo = dataSource.getRepository(ParkingSpot);

  // ── Traffic Locations ──
  const trafficLocations = [
    // Original locations
    { name: 'Gisimenti', level: 'high', latitude: -1.956, longitude: 30.0939 },
    {
      name: 'Sonatubes',
      level: 'medium',
      latitude: -1.974,
      longitude: 30.1044,
    },
    { name: 'Gishushu', level: 'low', latitude: -1.954, longitude: 30.087 },
    { name: 'Kimironko', level: 'medium', latitude: -1.944, longitude: 30.103 },
    { name: 'Nyabugogo', level: 'high', latitude: -1.942, longitude: 30.056 },
    {
      name: 'Downtown Kigali',
      level: 'medium',
      latitude: -1.95,
      longitude: 30.06,
    },
    // Additional Kigali hotspots
    { name: 'Remera', level: 'high', latitude: -1.948, longitude: 30.108 },
    { name: 'Kacyiru', level: 'medium', latitude: -1.938, longitude: 30.082 },
    { name: 'Kimihurura', level: 'low', latitude: -1.943, longitude: 30.081 },
    { name: 'Kicukiro', level: 'medium', latitude: -1.978, longitude: 30.098 },
    {
      name: 'Kanombe Junction',
      level: 'high',
      latitude: -1.969,
      longitude: 30.134,
    },
    {
      name: 'Airport Road',
      level: 'medium',
      latitude: -1.963,
      longitude: 30.13,
    },
    { name: 'Kabuga', level: 'low', latitude: -1.936, longitude: 30.165 },
    { name: 'Gatsata', level: 'medium', latitude: -1.926, longitude: 30.065 },
    { name: 'Muhima', level: 'high', latitude: -1.952, longitude: 30.054 },
    { name: 'Biryogo', level: 'medium', latitude: -1.956, longitude: 30.053 },
    { name: 'Nyamirambo', level: 'high', latitude: -1.968, longitude: 30.049 },
    { name: 'Gitega', level: 'low', latitude: -1.96, longitude: 30.057 },
    { name: 'Masaka', level: 'medium', latitude: -2.002, longitude: 30.079 },
    {
      name: 'Nyanza Road Junction',
      level: 'low',
      latitude: -2.01,
      longitude: 30.072,
    },
    {
      name: 'Kibagabaga',
      level: 'medium',
      latitude: -1.934,
      longitude: 30.099,
    },
    { name: 'Gaculiro', level: 'low', latitude: -1.931, longitude: 30.087 },
    { name: 'Rugando', level: 'medium', latitude: -1.939, longitude: 30.095 },
    { name: 'Zindiro', level: 'low', latitude: -1.929, longitude: 30.116 },
    {
      name: 'Bugesera Road',
      level: 'medium',
      latitude: -1.999,
      longitude: 30.12,
    },
  ];

  for (const loc of trafficLocations) {
    const existing = await trafficRepo.findOne({ where: { name: loc.name } });
    if (!existing) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await trafficRepo.save(trafficRepo.create(loc as any));
      console.log(` Seeded traffic: ${loc.name}`);
    } else {
      console.log(` Already exists: ${loc.name}`);
    }
  }

  // ── Parking Spots ──
  const parkingSpots = [
    {
      name: 'KBC Arena Parking',
      latitude: -1.957,
      longitude: 30.092,
      totalSpots: 50,
      openSpots: 24,
      priceRwf: 500,
    },
    {
      name: 'City Center Garage',
      latitude: -1.953,
      longitude: 30.062,
      totalSpots: 40,
      openSpots: 8,
      priceRwf: 700,
    },
    {
      name: 'Kicukiro Market Lot',
      latitude: -1.974,
      longitude: 30.104,
      totalSpots: 60,
      openSpots: 35,
      priceRwf: 300,
    },
    {
      name: 'Remera Parking',
      latitude: -1.948,
      longitude: 30.108,
      totalSpots: 80,
      openSpots: 60,
      priceRwf: 400,
    },
    {
      name: 'Kimihurura Lot',
      latitude: -1.942,
      longitude: 30.082,
      totalSpots: 30,
      openSpots: 5,
      priceRwf: 600,
    },
  ];

  for (const spot of parkingSpots) {
    const existing = await parkingRepo.findOne({ where: { name: spot.name } });
    if (!existing) {
      await parkingRepo.save(parkingRepo.create(spot));
      console.log(` Seeded parking: ${spot.name}`);
    } else {
      console.log(` Already exists: ${spot.name}`);
    }
  }

  // ── Points of Interest ──
  const poiRepo = dataSource.getRepository(PointOfInterest);
  const pois: Array<{
    name: string;
    type: 'gas_station' | 'restaurant' | 'garage';
    latitude: number;
    longitude: number;
    address: string;
    phone: string;
    openingHours: string;
    description: string | null;
  }> = [
    {
      name: 'Total Energies Remera',
      type: 'gas_station',
      latitude: -1.948,
      longitude: 30.109,
      address: 'KG 9 Ave, Remera',
      phone: '+250788100001',
      openingHours: 'Mon-Sun 06:00-22:00',
      description: null,
    },
    {
      name: 'Rubis Gisimenti',
      type: 'gas_station',
      latitude: -1.9555,
      longitude: 30.0935,
      address: 'KG 15 Ave, Gisimenti',
      phone: '+250788100002',
      openingHours: 'Mon-Sun 00:00-23:59',
      description: null,
    },
    {
      name: 'Rubis Kacyiru',
      type: 'gas_station',
      latitude: -1.938,
      longitude: 30.082,
      address: 'KG 7 Ave, Kacyiru',
      phone: '+250788100003',
      openingHours: 'Mon-Sun 06:00-22:00',
      description: null,
    },
    {
      name: 'Inzora Rooftop Cafe',
      type: 'restaurant',
      latitude: -1.95,
      longitude: 30.061,
      address: 'KN 3 Ave, Downtown',
      phone: '+250788200001',
      openingHours: 'Mon-Sun 08:00-22:00',
      description: 'Rooftop with city views',
    },
    {
      name: 'Khana Khazana',
      type: 'restaurant',
      latitude: -1.944,
      longitude: 30.081,
      address: 'Kimihurura, Kigali',
      phone: '+250788200002',
      openingHours: 'Mon-Sun 12:00-22:00',
      description: 'Indian cuisine',
    },
    {
      name: 'Meze Fresh Remera',
      type: 'restaurant',
      latitude: -1.947,
      longitude: 30.107,
      address: 'KG 11 Ave, Remera',
      phone: '+250788200003',
      openingHours: 'Mon-Sat 08:00-21:00',
      description: 'Sandwiches and coffee',
    },
    {
      name: 'Omega Auto Garage',
      type: 'garage',
      latitude: -1.977,
      longitude: 30.099,
      address: 'KK 15 Rd, Kicukiro',
      phone: '+250788300001',
      openingHours: 'Mon-Sat 07:30-18:00',
      description: 'General auto repairs',
    },
    {
      name: 'Remera Auto Center',
      type: 'garage',
      latitude: -1.949,
      longitude: 30.106,
      address: 'KG 12 Ave, Remera',
      phone: '+250788300002',
      openingHours: 'Mon-Sat 08:00-18:00',
      description: 'Car diagnostics',
    },
    {
      name: 'Nyabugogo Mechanics',
      type: 'garage',
      latitude: -1.941,
      longitude: 30.055,
      address: 'Nyabugogo, Kigali',
      phone: '+250788300003',
      openingHours: 'Mon-Sat 07:00-19:00',
      description: 'Heavy vehicle repairs',
    },
  ];

  for (const poi of pois) {
    const existing = await poiRepo.findOne({ where: { name: poi.name } });
    if (!existing) {
      await poiRepo.save(poiRepo.create(poi));
      console.log(` Seeded POI: ${poi.name}`);
    } else {
      console.log(` Already exists: ${poi.name}`);
    }
  }

  // ── Admin User ──
  const userRepo = dataSource.getRepository(User);
  const vehicleRepo = dataSource.getRepository(Vehicle);

  const ADMIN_EMAIL = 'admin@openway.rw';
  const ADMIN_PASSWORD = 'Password123?';

  const existingAdmin = await userRepo.findOne({
    where: { email: ADMIN_EMAIL },
  });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const admin = userRepo.create({
      firstName: 'OpenWay',
      lastName: 'Admin',
      email: ADMIN_EMAIL,
      passwordHash,
      isVerified: true,
      role: 'admin',
    });
    const savedAdmin = await userRepo.save(admin);
    // Admin still needs a vehicle row (FK constraint from registration flow)
    await vehicleRepo.save(
      vehicleRepo.create({
        userId: savedAdmin.id,
        make: '-',
        model: '-',
        licensePlate: null,
      }),
    );
    console.log(`\n Admin user created:`);
    console.log(`   Email   : ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   Role    : admin`);
  } else {
    console.log(` Admin user already exists: ${ADMIN_EMAIL}`);
  }

  console.log('\n Seeding complete!');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
