import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoadClosure } from '../database/entities/road-closure.entity';
import { RoadClosureController } from './road-closure.controller';
import { RoadClosureService } from './road-closure.service';

@Module({
  imports: [TypeOrmModule.forFeature([RoadClosure])],
  controllers: [RoadClosureController],
  providers: [RoadClosureService],
})
export class RoadClosureModule {}
