import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PointOfInterest, PoiType } from '../database/entities/point-of-interest.entity';
import { CreatePoiDto } from './dto/create-poi.dto';
import { UpdatePoiDto } from './dto/update-poi.dto';

@Injectable()
export class PoiService {
  constructor(
    @InjectRepository(PointOfInterest)
    private readonly repo: Repository<PointOfInterest>,
  ) {}

  private haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async getNearby(lat: number, lng: number, type?: PoiType, radiusMeters: number = 5000) {
    const where = type ? { type } : {};
    const pois = await this.repo.find({ where });

    return pois
      .map((poi) => ({
        id: poi.id,
        name: poi.name,
        type: poi.type,
        description: poi.description,
        address: poi.address,
        latitude: poi.latitude,
        longitude: poi.longitude,
        phone: poi.phone,
        openingHours: poi.openingHours,
        distanceMeters: Math.round(this.haversineMeters(lat, lng, poi.latitude, poi.longitude)),
      }))
      .filter((p) => p.distanceMeters <= radiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  async create(dto: CreatePoiDto): Promise<PointOfInterest> {
    const poi = this.repo.create({
      name: dto.name,
      type: dto.type,
      description: dto.description ?? null,
      address: dto.address ?? null,
      latitude: dto.latitude,
      longitude: dto.longitude,
      phone: dto.phone ?? null,
      openingHours: dto.openingHours ?? null,
    });
    return this.repo.save(poi);
  }

  async update(id: string, dto: UpdatePoiDto): Promise<PointOfInterest> {
    const poi = await this.repo.findOne({ where: { id } });
    if (!poi) throw new NotFoundException({ error: 'POI not found', code: 'POI_NOT_FOUND' });
    if (dto.name !== undefined) poi.name = dto.name;
    if (dto.type !== undefined) poi.type = dto.type as PoiType;
    if (dto.description !== undefined) poi.description = dto.description;
    if (dto.address !== undefined) poi.address = dto.address;
    if (dto.latitude !== undefined) poi.latitude = dto.latitude;
    if (dto.longitude !== undefined) poi.longitude = dto.longitude;
    if (dto.phone !== undefined) poi.phone = dto.phone;
    if (dto.openingHours !== undefined) poi.openingHours = dto.openingHours;
    return this.repo.save(poi);
  }

  async remove(id: string): Promise<void> {
    const poi = await this.repo.findOne({ where: { id } });
    if (!poi) throw new NotFoundException({ error: 'POI not found', code: 'POI_NOT_FOUND' });
    await this.repo.remove(poi);
  }
}
