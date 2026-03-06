import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { validate } from './config/env.validation';
import { NotificationModule } from './common/notifications/notification.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TrafficModule } from './traffic/traffic.module';
import { ParkingModule } from './parking/parking.module';
import { WeatherModule } from './weather/weather.module';
import { TripModule } from './trip/trip.module';
import { User } from './database/entities/user.entity';
import { Vehicle } from './database/entities/vehicle.entity';
import { TrafficLocation } from './database/entities/traffic-location.entity';
import { ParkingSpot } from './database/entities/parking-spot.entity';
import { Trip } from './database/entities/trip.entity';
import { Place } from './database/entities/place.entity';
import { TokenBlacklist } from './database/entities/token-blacklist.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL') ?? '';
        const requiresSsl = dbUrl.includes('sslmode=require');
        return {
          type: 'postgres',
          url: dbUrl,
          entities: [
            User,
            Vehicle,
            TrafficLocation,
            ParkingSpot,
            Trip,
            Place,
            TokenBlacklist,
          ],
          synchronize: configService.get<string>('NODE_ENV') !== 'production',
          ssl: requiresSsl ? { rejectUnauthorized: false } : false,
        };
      },
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
    NotificationModule,
    AuthModule,
    UserModule,
    TrafficModule,
    ParkingModule,
    WeatherModule,
    TripModule,
  ],
})
export class AppModule {}
