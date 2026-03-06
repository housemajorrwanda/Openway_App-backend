import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { NotificationService } from '../common/notifications/notification.service';
import { TrafficLocation } from '../database/entities/traffic-location.entity';
import { Trip, TripStatus } from '../database/entities/trip.entity';

// Radius in km to consider a traffic hotspot "on the route"
const TRAFFIC_ALERT_RADIUS_KM = 3;

@Injectable()
export class TripScheduler {
  private readonly logger = new Logger(TripScheduler.name);

  constructor(
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
    @InjectRepository(TrafficLocation)
    private readonly trafficRepo: Repository<TrafficLocation>,
    private readonly notifications: NotificationService,
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

  // Returns true if point (lat, lng) is within TRAFFIC_ALERT_RADIUS_KM of the
  // straight line between origin and destination (simple midpoint check).
  private isNearRoute(
    originLat: number, originLng: number,
    destLat: number, destLng: number,
    pointLat: number, pointLng: number,
  ): boolean {
    // Check proximity to origin, destination, and route midpoint
    const midLat = (originLat + destLat) / 2;
    const midLng = (originLng + destLng) / 2;
    return (
      this.haversineKm(originLat, originLng, pointLat, pointLng) <= TRAFFIC_ALERT_RADIUS_KM ||
      this.haversineKm(destLat, destLng, pointLat, pointLng) <= TRAFFIC_ALERT_RADIUS_KM ||
      this.haversineKm(midLat, midLng, pointLat, pointLng) <= TRAFFIC_ALERT_RADIUS_KM
    );
  }

  // Runs every 10 minutes — checks for trips starting in 10–20 minutes
  @Cron('*/10 * * * *')
  async remindUpcomingTrips() {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 10 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 20 * 60 * 1000);

    const upcoming = await this.tripRepo.find({
      where: {
        status: TripStatus.SCHEDULED,
        scheduledAt: Between(windowStart, windowEnd),
      },
    });

    for (const trip of upcoming) {
      this.logger.log(`Sending reminder for trip ${trip.id}`);
      await this.notifications.sendToUser(trip.userId, {
        title: '🗺 Trip reminder',
        body: `Your trip to ${trip.destinationName} is starting soon.`,
        data: { type: 'TRIP_REMINDER', tripId: trip.id },
      });
    }
  }

  // Runs every 10 minutes — alerts users with IN_PROGRESS trips about high traffic on their route
  @Cron('*/10 * * * *')
  async alertTrafficOnActiveTrips() {
    const [activeTrips, hotspots] = await Promise.all([
      this.tripRepo.find({ where: { status: TripStatus.IN_PROGRESS } }),
      this.trafficRepo.find(),
    ]);

    if (!activeTrips.length || !hotspots.length) return;

    const highHotspots = hotspots.filter((h) => h.level === 'high');
    if (!highHotspots.length) return;

    for (const trip of activeTrips) {
      const affectedHotspots = highHotspots.filter((h) =>
        this.isNearRoute(
          Number(trip.originLat), Number(trip.originLng),
          Number(trip.destinationLat), Number(trip.destinationLng),
          h.latitude, h.longitude,
        ),
      );

      if (!affectedHotspots.length) continue;

      const names = affectedHotspots.map((h) => h.name).join(', ');
      const maxDelay = Math.max(...affectedHotspots.map((h) => h.delayMinutes ?? 0));
      const delayText = maxDelay > 0 ? ` (~${maxDelay} min delay)` : '';

      await this.notifications.sendToUser(trip.userId, {
        title: '🚦 Heavy traffic on your route',
        body: `Heavy traffic at ${names}${delayText}. Consider an alternate route.`,
        data: {
          type: 'TRIP_TRAFFIC_ALERT',
          tripId: trip.id,
          hotspots: affectedHotspots.map((h) => h.id),
        },
      });

      this.logger.log(`Traffic alert sent to user ${trip.userId} for trip ${trip.id}: ${names}`);
    }
  }
}
