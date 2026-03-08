import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoadClosure } from '../database/entities/road-closure.entity';
import { RoadClosureController } from './road-closure.controller';
import { RoadClosureService } from './road-closure.service';
import { RoadClosureScheduler } from './road-closure.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([RoadClosure])],
  controllers: [RoadClosureController],
  providers: [RoadClosureService, RoadClosureScheduler],
})
export class RoadClosureModule {}
