import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrafficLocation } from '../database/entities/traffic-location.entity';
import { TrafficController } from './traffic.controller';
import { TrafficService } from './traffic.service';
import { TrafficScheduler } from './traffic.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([TrafficLocation])],
  controllers: [TrafficController],
  providers: [TrafficService, TrafficScheduler],
})
export class TrafficModule {}
