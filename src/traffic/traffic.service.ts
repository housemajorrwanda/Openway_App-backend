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

  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async getLocations(userLat?: number, userLng?: number, radiusKm: number = 15) {
    const locations = await this.trafficRepo.find({ order: { name: 'ASC' } });

    const mapped = locations.map((loc) => {
      const distanceFromUserKm =
        userLat != null && userLng != null
          ? Math.round(this.haversineKm(userLat, userLng, loc.latitude, loc.longitude) * 10) / 10
          : null;

      return {
        id: loc.id,
        name: loc.name,
        level: loc.level,
        latitude: loc.latitude,
        longitude: loc.longitude,
        distanceFromUserKm,
        distanceKm: loc.distanceKm,
        durationMinutes: loc.durationMinutes,
        durationInTrafficMinutes: loc.durationInTrafficMinutes,
        delayMinutes: loc.delayMinutes,
        updatedAt: loc.updatedAt.toISOString(),
      };
    });

    // If user location provided, filter by radius and sort nearest first
    const filtered =
      userLat != null && userLng != null
        ? mapped
            .filter((loc) => loc.distanceFromUserKm! <= radiusKm)
            .sort((a, b) => a.distanceFromUserKm! - b.distanceFromUserKm!)
        : mapped;

    return { locations: filtered };
  }
}
