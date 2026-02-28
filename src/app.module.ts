import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { validate } from './config/env.validation';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TrafficModule } from './traffic/traffic.module';
import { ParkingModule } from './parking/parking.module';
import { WeatherModule } from './weather/weather.module';
import { User } from './database/entities/user.entity';
import { Vehicle } from './database/entities/vehicle.entity';
import { TrafficLocation } from './database/entities/traffic-location.entity';
import { ParkingSpot } from './database/entities/parking-spot.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [User, Vehicle, TrafficLocation, ParkingSpot],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        ssl:
          configService.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
    RedisModule,
    AuthModule,
    UserModule,
    TrafficModule,
    ParkingModule,
    WeatherModule,
  ],
})
export class AppModule {}
