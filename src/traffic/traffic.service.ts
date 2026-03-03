import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from '../common/notifications/notification.service';
import { TrafficLocation } from '../database/entities/traffic-location.entity';

@Injectable()
export class TrafficService {
  constructor(
    @InjectRepository(TrafficLocation)
    private readonly trafficRepo: Repository<TrafficLocation>,
    private readonly notifications: NotificationService,
  ) {}

  // Called internally (e.g. by an admin or scheduled data sync) when traffic level changes
  async broadcastTrafficAlert(locationId: string): Promise<void> {
    const loc = await this.trafficRepo.findOne({ where: { id: locationId } });
    if (!loc) throw new NotFoundException({ error: 'Location not found', code: 'LOCATION_NOT_FOUND' });

    if (loc.level === 'high') {
      await this.notifications.broadcast({
        title: '🚦 Heavy traffic alert',
        body: `High traffic detected at ${loc.name}, Kigali. Plan your route accordingly.`,
        data: { type: 'TRAFFIC_ALERT', locationId: loc.id, level: loc.level },
      });
    }
  }

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
