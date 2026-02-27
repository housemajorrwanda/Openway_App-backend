import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrafficLocation } from '../database/entities/traffic-location.entity';
import { TrafficController } from './traffic.controller';
import { TrafficService } from './traffic.service';

@Module({
  imports: [TypeOrmModule.forFeature([TrafficLocation])],
  controllers: [TrafficController],
  providers: [TrafficService],
})
export class TrafficModule {}
