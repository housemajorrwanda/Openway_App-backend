import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './entities/user.entity';
import { Vehicle } from './entities/vehicle.entity';
import { TrafficLocation } from './entities/traffic-location.entity';
import { ParkingSpot } from './entities/parking-spot.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Vehicle, TrafficLocation, ParkingSpot],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: false,
});
