import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Place } from '../database/entities/place.entity';
import { Trip } from '../database/entities/trip.entity';
import { TripController } from './trip.controller';
import { TripScheduler } from './trip.scheduler';
import { TripService } from './trip.service';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, Place])],
  controllers: [TripController],
  providers: [TripService, TripScheduler],
})
export class TripModule {}
