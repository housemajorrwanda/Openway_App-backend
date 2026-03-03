import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { NotificationService } from '../common/notifications/notification.service';
import { Trip, TripStatus } from '../database/entities/trip.entity';

@Injectable()
export class TripScheduler {
  private readonly logger = new Logger(TripScheduler.name);

  constructor(
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
    private readonly notifications: NotificationService,
  ) {}

  // Runs every minute — checks for trips starting in ~15 minutes
  @Cron(CronExpression.EVERY_MINUTE)
  async remindUpcomingTrips() {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 14 * 60 * 1000); // 14 min from now
    const windowEnd = new Date(now.getTime() + 16 * 60 * 1000);   // 16 min from now

    const upcoming = await this.tripRepo.find({
      where: {
        status: TripStatus.SCHEDULED,
        scheduledAt: Between(windowStart, windowEnd),
      },
    });

    for (const trip of upcoming) {
      this.logger.log(`Sending 15-min reminder for trip ${trip.id}`);
      await this.notifications.sendToUser(trip.userId, {
        title: '🗺 Trip reminder — 15 minutes',
        body: `Your trip to ${trip.destinationName} starts in 15 minutes.`,
        data: { type: 'TRIP_REMINDER', tripId: trip.id },
      });
    }
  }
}
