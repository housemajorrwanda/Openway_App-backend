import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository } from 'typeorm';
import { TrafficLevel, TrafficLocation } from '../database/entities/traffic-location.entity';
import { NotificationService } from '../common/notifications/notification.service';

// Kigali city center — used as origin for distance/duration baseline
const KIGALI_CENTER = { latitude: -1.9536, longitude: 30.0606 };

// Small offset (~400m) used to create a short probe route through each hotspot
const PROBE_OFFSET = 0.004;

// % of slow/jammed segments to classify congestion
const HIGH_SLOW_PERCENT = 0.4;   // 40%+ slow or jammed → high
const MEDIUM_SLOW_PERCENT = 0.15; // 15%+ slow or jammed → medium

@Injectable()
export class TrafficScheduler implements OnModuleInit {
  private readonly logger = new Logger(TrafficScheduler.name);
  private readonly apiKey: string;

  constructor(
    @InjectRepository(TrafficLocation)
    private readonly trafficRepo: Repository<TrafficLocation>,
    private readonly notifications: NotificationService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY') ?? '';
  }

  // Run once on startup so traffic data is never null after a fresh deploy
  async onModuleInit() {
    this.logger.log('Running initial traffic refresh on startup...');
    await this.refreshTrafficLevels();
  }

  // Runs every 10 minutes
  @Cron('*/10 * * * *')
  async refreshTrafficLevels(): Promise<void> {
    const locations = await this.trafficRepo.find();
    if (!locations.length) return;

    // ── Step 1: Distance Matrix for duration/delay data (1 API call for all) ──
    const destinations = locations
      .map((loc) => `${loc.latitude},${loc.longitude}`)
      .join('|');

    let matrixRows: any[] = [];
    try {
      const { data } = await axios.get(
        'https://maps.googleapis.com/maps/api/distancematrix/json',
        {
          params: {
            origins: `${KIGALI_CENTER.latitude},${KIGALI_CENTER.longitude}`,
            destinations,
            departure_time: 'now',
            traffic_model: 'best_guess',
            key: this.apiKey,
          },
          timeout: 10_000,
        },
      );
      if (data.status === 'OK') {
        matrixRows = data.rows[0]?.elements ?? [];
      } else {
        this.logger.warn(`Distance Matrix status: ${data.status}`);
      }
    } catch (err) {
      this.logger.error('Distance Matrix API failed', err?.message);
    }

    // ── Step 2: Routes API per location for real segment-level speed data ──
    for (let i = 0; i < locations.length; i++) {
      const loc = locations[i];
      const previousLevel = loc.level;

      // Enrich duration/delay from Distance Matrix
      const el = matrixRows[i];
      if (el?.status === 'OK') {
        const freeSec: number = el.duration.value;
        const trafficSec: number = el.duration_in_traffic?.value ?? freeSec;
        loc.distanceKm = Math.round((el.distance.value / 1000) * 10) / 10;
        loc.durationMinutes = Math.round(freeSec / 60);
        loc.durationInTrafficMinutes = Math.round(trafficSec / 60);
        loc.delayMinutes = Math.max(0, Math.round((trafficSec - freeSec) / 60));
      }

      // Probe route: origin slightly north of hotspot → destination slightly south
      const origin = { latitude: loc.latitude - PROBE_OFFSET, longitude: loc.longitude };
      const destination = { latitude: loc.latitude + PROBE_OFFSET, longitude: loc.longitude };

      let newLevel: TrafficLevel = 'low';
      try {
        const { data } = await axios.post(
          'https://routes.googleapis.com/directions/v2:computeRoutes',
          {
            origin: { location: { latLng: origin } },
            destination: { location: { latLng: destination } },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE',
            extraComputations: ['TRAFFIC_ON_POLYLINE'],
          },
          {
            headers: {
              'X-Goog-Api-Key': this.apiKey,
              'X-Goog-FieldMask':
                'routes.travelAdvisory.speedReadingIntervals',
            },
            timeout: 10_000,
          },
        );

        const intervals: Array<{ speed: string }> =
          data.routes?.[0]?.travelAdvisory?.speedReadingIntervals ?? [];

        if (intervals.length > 0) {
          const slowCount = intervals.filter(
            (s) => s.speed === 'SLOW' || s.speed === 'TRAFFIC_JAM',
          ).length;
          const slowPercent = slowCount / intervals.length;

          if (slowPercent >= HIGH_SLOW_PERCENT) {
            newLevel = 'high';
          } else if (slowPercent >= MEDIUM_SLOW_PERCENT) {
            newLevel = 'medium';
          } else {
            newLevel = 'low';
          }

          this.logger.debug(
            `${loc.name}: ${slowCount}/${intervals.length} slow segments (${(slowPercent * 100).toFixed(0)}%) → ${newLevel}`,
          );
        } else {
          // No segment data — fall back to duration ratio if available
          if (el?.status === 'OK') {
            const ratio = el.duration.value > 0
              ? (el.duration_in_traffic?.value ?? el.duration.value) / el.duration.value
              : 1;
            newLevel = ratio >= 1.5 ? 'high' : ratio >= 1.2 ? 'medium' : 'low';
          }
        }
      } catch (err) {
        this.logger.warn(`Routes API failed for ${loc.name}: ${err?.message}`);
        // Fall back to duration ratio
        if (el?.status === 'OK') {
          const ratio = el.duration.value > 0
            ? (el.duration_in_traffic?.value ?? el.duration.value) / el.duration.value
            : 1;
          newLevel = ratio >= 1.5 ? 'high' : ratio >= 1.2 ? 'medium' : 'low';
        }
      }

      loc.level = newLevel;
      await this.trafficRepo.save(loc);

      if (newLevel !== previousLevel) {
        this.logger.log(
          `${loc.name}: ${previousLevel} → ${newLevel} (delay: ${loc.delayMinutes ?? 0}min)`,
        );

        if (newLevel === 'high') {
          await this.notifications.broadcast(
            {
              title: 'Heavy traffic alert',
              body: `Heavy traffic at ${loc.name} — expect ${loc.delayMinutes ?? 'some'}+ min delay.`,
              data: { type: 'TRAFFIC_ALERT', locationId: loc.id, level: newLevel },
            },
            'trafficUpdates',
          );
        }
      }
    }

    this.logger.log('Traffic levels refreshed');
  }
}
