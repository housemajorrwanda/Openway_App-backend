import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointOfInterest } from '../database/entities/point-of-interest.entity';
import { PoiController } from './poi.controller';
import { PoiService } from './poi.service';

@Module({
  imports: [TypeOrmModule.forFeature([PointOfInterest])],
  controllers: [PoiController],
  providers: [PoiService],
})
export class PoiModule {}
