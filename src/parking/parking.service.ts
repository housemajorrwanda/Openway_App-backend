import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParkingSpot } from '../database/entities/parking-spot.entity';
import { UpdateParkingDto } from './dto/update-parking.dto';

export interface CreateParkingDto {
  name: string;
  latitude: number;
  longitude: number;
  totalSpots: number;
  openSpots: number;
  priceRwf: number;
}

@Injectable()
export class ParkingService {
  constructor(
    @InjectRepository(ParkingSpot)
    private readonly parkingRepo: Repository<ParkingSpot>,
  ) {}

  /**
   * Haversine formula — returns distance in meters between two lat/lng points.
   */
  private haversineMeters(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371000; // Earth's radius in metres
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async getNearby(lat: number, lng: number, radiusMeters: number = 5000) {
    const spots = await this.parkingRepo.find();

    const nearby = spots
      .map((spot) => {
        const distanceMeters = Math.round(
          this.haversineMeters(lat, lng, spot.latitude, spot.longitude),
        );
        return {
          id: spot.id,
          name: spot.name,
          latitude: spot.latitude,
          longitude: spot.longitude,
          openSpots: spot.openSpots,
          totalSpots: spot.totalSpots,
          priceRwfPerHour: spot.priceRwf,
          distanceMeters,
          availabilityPercent: Math.round(
            (spot.openSpots / spot.totalSpots) * 100,
          ),
        };
      })
      .filter((s) => s.distanceMeters <= radiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);

    return { spots: nearby };
  }

  // ─── Admin methods ─────────────────────────────────────────────────────────

  async createSpot(dto: CreateParkingDto): Promise<ParkingSpot> {
    const spot = this.parkingRepo.create(dto);
    return this.parkingRepo.save(spot);
  }

  async updateSpot(id: string, dto: UpdateParkingDto): Promise<ParkingSpot> {
    const spot = await this.parkingRepo.findOne({ where: { id } });
    if (!spot) throw new NotFoundException({ error: 'Parking spot not found', code: 'PARKING_NOT_FOUND' });
    if (dto.name !== undefined) spot.name = dto.name;
    if (dto.latitude !== undefined) spot.latitude = dto.latitude;
    if (dto.longitude !== undefined) spot.longitude = dto.longitude;
    if (dto.totalSpots !== undefined) spot.totalSpots = dto.totalSpots;
    if (dto.openSpots !== undefined) spot.openSpots = dto.openSpots;
    if (dto.priceRwf !== undefined) spot.priceRwf = dto.priceRwf;
    return this.parkingRepo.save(spot);
  }

  async deleteSpot(id: string): Promise<void> {
    const spot = await this.parkingRepo.findOne({ where: { id } });
    if (!spot) throw new NotFoundException({ error: 'Parking spot not found', code: 'PARKING_NOT_FOUND' });
    await this.parkingRepo.remove(spot);
  }
}
