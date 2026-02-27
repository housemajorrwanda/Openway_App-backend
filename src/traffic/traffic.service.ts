import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrafficLocation } from '../database/entities/traffic-location.entity';

@Injectable()
export class TrafficService {
  constructor(
    @InjectRepository(TrafficLocation)
    private readonly trafficRepo: Repository<TrafficLocation>,
  ) {}

  async getLocations() {
    const locations = await this.trafficRepo.find({
      order: { name: 'ASC' },
    });

    return {
      locations: locations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        level: loc.level,
        latitude: loc.latitude,
        longitude: loc.longitude,
        updatedAt: loc.updatedAt.toISOString(),
      })),
    };
  }
}
