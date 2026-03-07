import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
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

  // Tracks trip+hotspot pairs already alerted to avoid spamming same notification
  private readonly alerted = new Set<string>();

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

  private isNearRoute(
    originLat: number, originLng: number,
    destLat: number, destLng: number,
    pointLat: number, pointLng: number,
  ): boolean {
    const midLat = (originLat + destLat) / 2;
    const midLng = (originLng + destLng) / 2;
    return (
      this.haversineKm(originLat, originLng, pointLat, pointLng) <= TRAFFIC_ALERT_RADIUS_KM ||
      this.haversineKm(destLat, destLng, pointLat, pointLng) <= TRAFFIC_ALERT_RADIUS_KM ||
      this.haversineKm(midLat, midLng, pointLat, pointLng) <= TRAFFIC_ALERT_RADIUS_KM
    );
  }

  // Runs every minute — reminds users 15 min before their departure time
  @Cron('* * * * *')
  async remindUpcomingTrips() {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 14 * 60 * 1000); // 14 min from now
    const windowEnd = new Date(now.getTime() + 15 * 60 * 1000);   // 15 min from now

    const upcoming = await this.tripRepo.find({
      where: {
        status: TripStatus.SCHEDULED,
        departureTime: Between(windowStart, windowEnd),
      },
    });

    for (const trip of upcoming) {
      this.logger.log(`Sending departure reminder for trip ${trip.id}`);
      await this.notifications.sendToUser(
        trip.userId,
        {
          title: '🕐 Time to leave!',
          body: `Your trip to ${trip.destinationName} starts in 15 minutes.`,
          data: { type: 'TRIP_REMINDER', tripId: trip.id },
        },
        'trafficUpdates',
      );
    }
  }

  // Runs every 10 minutes — warns users about traffic on their route 30 min before departure
  @Cron('*/10 * * * *')
  async warnTrafficBeforeDeparture() {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 20 * 60 * 1000); // 20 min from now
    const windowEnd = new Date(now.getTime() + 40 * 60 * 1000);   // 40 min from now

    const [upcoming, hotspots] = await Promise.all([
      this.tripRepo.find({
        where: {
          status: TripStatus.SCHEDULED,
          departureTime: Between(windowStart, windowEnd),
        },
      }),
      this.trafficRepo.find(),
    ]);

    if (!upcoming.length || !hotspots.length) return;

    const highHotspots = hotspots.filter((h) => h.level === 'high' || h.level === 'medium');

    for (const trip of upcoming) {
      const affected = highHotspots.filter((h) =>
        this.isNearRoute(
          Number(trip.originLat), Number(trip.originLng),
          Number(trip.destinationLat), Number(trip.destinationLng),
          h.latitude, h.longitude,
        ),
      );

      if (!affected.length) continue;

      const names = affected.map((h) => h.name).join(', ');
      const maxDelay = Math.max(...affected.map((h) => h.delayMinutes ?? 0));
      const delayText = maxDelay > 0 ? ` (~${maxDelay} min delay)` : '';
      const departureStr = trip.departureTime
        ? trip.departureTime.toTimeString().slice(0, 5)
        : '';

      await this.notifications.sendToUser(
        trip.userId,
        {
          title: '🚦 Traffic ahead before your trip',
          body: `Traffic at ${names}${delayText}. Consider leaving earlier for your ${departureStr} trip to ${trip.destinationName}.`,
          data: { type: 'PRE_TRIP_TRAFFIC_ALERT', tripId: trip.id },
        },
        'trafficUpdates',
      );

      this.logger.log(`Pre-departure traffic alert for trip ${trip.id}: ${names}`);
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

    // Clean up alerted keys for trips that are no longer active
    const activeTripIds = new Set(activeTrips.map((t) => t.id));
    for (const key of this.alerted) {
      const tripId = key.split(':')[0];
      if (!activeTripIds.has(tripId)) this.alerted.delete(key);
    }

    const highHotspots = hotspots.filter((h) => h.level === 'high');
    if (!highHotspots.length) return;

    for (const trip of activeTrips) {
      const affectedHotspots = highHotspots.filter((h) => {
        const key = `${trip.id}:${h.id}`;
        if (this.alerted.has(key)) return false;
        return this.isNearRoute(
          Number(trip.originLat), Number(trip.originLng),
          Number(trip.destinationLat), Number(trip.destinationLng),
          h.latitude, h.longitude,
        );
      });

      if (!affectedHotspots.length) continue;

      for (const h of affectedHotspots) this.alerted.add(`${trip.id}:${h.id}`);

      const names = affectedHotspots.map((h) => h.name).join(', ');
      const maxDelay = Math.max(...affectedHotspots.map((h) => h.delayMinutes ?? 0));
      const delayText = maxDelay > 0 ? ` (~${maxDelay} min delay)` : '';

      await this.notifications.sendToUser(
        trip.userId,
        {
          title: '🚦 Heavy traffic on your route',
          body: `Heavy traffic at ${names}${delayText}. Consider an alternate route.`,
          data: {
            type: 'TRIP_TRAFFIC_ALERT',
            tripId: trip.id,
            hotspots: affectedHotspots.map((h) => h.id),
          },
        },
        'trafficUpdates',
      );

      this.logger.log(`Traffic alert sent to user ${trip.userId} for trip ${trip.id}: ${names}`);
    }
  }
}
