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

  // Runs every 10 minutes — checks for trips starting in 10–20 minutes
  @Cron('*/10 * * * *')
  async remindUpcomingTrips() {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 10 * 60 * 1000); // 10 min from now
    const windowEnd = new Date(now.getTime() + 20 * 60 * 1000);   // 20 min from now

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
}
