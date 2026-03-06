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

  /**
   * Distance from point P to the line segment AB (in km).
   * Used to check if a traffic hotspot lies along a route.
   */
  private distanceToSegmentKm(
    pLat: number, pLng: number,
    aLat: number, aLng: number,
    bLat: number, bLng: number,
  ): number {
    const dx = bLng - aLng;
    const dy = bLat - aLat;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) return this.haversineKm(pLat, pLng, aLat, aLng);

    // Project P onto line AB, clamped to [0,1]
    const t = Math.max(0, Math.min(1, ((pLng - aLng) * dx + (pLat - aLat) * dy) / lenSq));
    const closestLat = aLat + t * dy;
    const closestLng = aLng + t * dx;
    return this.haversineKm(pLat, pLng, closestLat, closestLng);
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

  async getRouteTraffic(
    originLat: number, originLng: number,
    destLat: number, destLng: number,
    corridorKm: number = 2,
  ) {
    const locations = await this.trafficRepo.find({ order: { name: 'ASC' } });

    const onRoute = locations
      .map((loc) => {
        const distanceFromRouteKm = Math.round(
          this.distanceToSegmentKm(loc.latitude, loc.longitude, originLat, originLng, destLat, destLng) * 10,
        ) / 10;
        const distanceFromOriginKm = Math.round(
          this.haversineKm(originLat, originLng, loc.latitude, loc.longitude) * 10,
        ) / 10;
        return {
          id: loc.id,
          name: loc.name,
          level: loc.level,
          latitude: loc.latitude,
          longitude: loc.longitude,
          distanceFromRouteKm,
          distanceFromOriginKm,
          distanceKm: loc.distanceKm,
          durationMinutes: loc.durationMinutes,
          durationInTrafficMinutes: loc.durationInTrafficMinutes,
          delayMinutes: loc.delayMinutes,
          updatedAt: loc.updatedAt.toISOString(),
        };
      })
      .filter((loc) => loc.distanceFromRouteKm <= corridorKm)
      .sort((a, b) => a.distanceFromOriginKm - b.distanceFromOriginKm); // ordered along the route

    const totalDelayMinutes = onRoute.reduce((sum, loc) => sum + (loc.delayMinutes ?? 0), 0);
    const worstLevel = onRoute.some((l) => l.level === 'high')
      ? 'high'
      : onRoute.some((l) => l.level === 'medium')
        ? 'medium'
        : onRoute.length > 0 ? 'low' : 'clear';

    // dataReady = false means the cron hasn't run yet (no Google API key or cold start)
    const dataReady = onRoute.every((l) => l.durationInTrafficMinutes !== null);

    return { worstLevel, totalDelayMinutes, dataReady, hotspots: onRoute };
  }
}
