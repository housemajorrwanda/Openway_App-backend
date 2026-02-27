import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingSpot } from '../database/entities/parking-spot.entity';
import { ParkingController } from './parking.controller';
import { ParkingService } from './parking.service';

@Module({
  imports: [TypeOrmModule.forFeature([ParkingSpot])],
  controllers: [ParkingController],
  providers: [ParkingService],
})
export class ParkingModule {}
