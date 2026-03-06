import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { NotificationService } from '../common/notifications/notification.service';
import { Place, PlaceType } from '../database/entities/place.entity';
import { Trip, TripStatus } from '../database/entities/trip.entity';
import { CompleteTripDto } from './dto/complete-trip.dto';
import { CreateTripDto } from './dto/create-trip.dto';
import { SavePlaceDto } from './dto/save-place.dto';

@Injectable()
export class TripService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Place)
    private readonly placeRepo: Repository<Place>,
    private readonly notifications: NotificationService,
  ) {}

  // ─── Trips ────────────────────────────────────────────────────────────────

  async createTrip(userId: string, dto: CreateTripDto): Promise<Trip> {
    const trip = this.tripRepo.create({
      userId,
      originLat: dto.originLat,
      originLng: dto.originLng,
      destinationName: dto.destinationName,
      destinationLat: dto.destinationLat,
      destinationLng: dto.destinationLng,
      note: dto.note ?? null,
      status: TripStatus.SCHEDULED,
    });
    return this.tripRepo.save(trip);
  }

  async getTrips(
    userId: string,
    status?: TripStatus,
  ): Promise<Trip[]> {
    const where: Record<string, any> = { userId };
    if (status) where['status'] = status;
    return this.tripRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getTrip(userId: string, tripId: string): Promise<Trip> {
    const trip = await this.tripRepo.findOne({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException({ error: 'Trip not found', code: 'TRIP_NOT_FOUND' });
    }
    if (trip.userId !== userId) {
      throw new ForbiddenException({ error: 'Access denied', code: 'FORBIDDEN' });
    }
    return trip;
  }

  async startTrip(userId: string, tripId: string): Promise<Trip> {
    const trip = await this.getTrip(userId, tripId);
    trip.status = TripStatus.IN_PROGRESS;
    trip.startedAt = new Date();
    const saved = await this.tripRepo.save(trip);
    await this.notifications.sendToUser(userId, {
      title: '🚗 Trip started',
      body: `Navigating to ${trip.destinationName}. Have a safe trip!`,
      data: { type: 'TRIP_STARTED', tripId: trip.id },
    });
    return saved;
  }

  async completeTrip(
    userId: string,
    tripId: string,
    dto: CompleteTripDto,
  ): Promise<Trip> {
    const trip = await this.getTrip(userId, tripId);
    trip.status = TripStatus.COMPLETED;
    trip.completedAt = new Date();
    if (dto.distanceKm !== undefined) trip.distanceKm = dto.distanceKm;
    if (dto.durationMin !== undefined) trip.durationMin = dto.durationMin;
    const saved = await this.tripRepo.save(trip);
    const distText = dto.distanceKm ? ` · ${dto.distanceKm} km` : '';
    const durText = dto.durationMin ? ` · ${dto.durationMin} min` : '';
    await this.notifications.sendToUser(userId, {
      title: '✅ Trip completed',
      body: `You arrived at ${trip.destinationName}${distText}${durText}.`,
      data: { type: 'TRIP_COMPLETED', tripId: trip.id },
    });
    return saved;
  }

  async cancelTrip(userId: string, tripId: string): Promise<Trip> {
    const trip = await this.getTrip(userId, tripId);
    trip.status = TripStatus.CANCELLED;
    return this.tripRepo.save(trip);
  }

  async deleteTrip(userId: string, tripId: string): Promise<void> {
    const trip = await this.getTrip(userId, tripId);
    await this.tripRepo.remove(trip);
  }

  // ─── History summary ──────────────────────────────────────────────────────

  async getHistory(userId: string) {
    const [scheduled, completed, cancelled, searches, favourites] =
      await Promise.all([
        this.tripRepo.find({
          where: [
            { userId, status: TripStatus.SCHEDULED },
            { userId, status: TripStatus.IN_PROGRESS },
          ],
          order: { createdAt: 'DESC' },
        }),
        this.tripRepo.find({
          where: { userId, status: TripStatus.COMPLETED },
          order: { completedAt: 'DESC' },
          take: 50,
        }),
        this.tripRepo.find({
          where: { userId, status: TripStatus.CANCELLED },
          order: { createdAt: 'DESC' },
          take: 20,
        }),
        this.placeRepo.find({
          where: { userId, type: PlaceType.SEARCH },
          order: { createdAt: 'DESC' },
          take: 30,
        }),
        this.placeRepo.find({
          where: { userId, type: PlaceType.FAVOURITE },
          order: { createdAt: 'DESC' },
        }),
      ]);

    return { scheduled, completed, cancelled, searches, favourites };
  }

  // ─── Places ───────────────────────────────────────────────────────────────

  async savePlace(userId: string, dto: SavePlaceDto): Promise<Place> {
    // Avoid duplicate search history for same location
    if (dto.type === PlaceType.SEARCH || !dto.type) {
      const existing = await this.placeRepo.findOne({
        where: { userId, name: dto.name, type: PlaceType.SEARCH },
      });
      if (existing) {
        existing.createdAt = new Date();
        return this.placeRepo.save(existing);
      }
    }

    const place = this.placeRepo.create({
      userId,
      name: dto.name,
      address: dto.address ?? null,
      latitude: dto.latitude,
      longitude: dto.longitude,
      type: dto.type ?? PlaceType.SEARCH,
    });
    return this.placeRepo.save(place);
  }

  async getFavourites(userId: string): Promise<Place[]> {
    return this.placeRepo.find({
      where: { userId, type: PlaceType.FAVOURITE },
      order: { createdAt: 'DESC' },
    });
  }

  async deletePlace(userId: string, placeId: string): Promise<void> {
    const place = await this.placeRepo.findOne({ where: { id: placeId } });
    if (!place) {
      throw new NotFoundException({ error: 'Place not found', code: 'PLACE_NOT_FOUND' });
    }
    if (place.userId !== userId) {
      throw new ForbiddenException({ error: 'Access denied', code: 'FORBIDDEN' });
    }
    await this.placeRepo.remove(place);
  }
}
