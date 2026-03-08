import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { RoadClosure } from '../database/entities/road-closure.entity';
import { RoadClosureService } from './road-closure.service';

@Injectable()
export class RoadClosureScheduler {
  private readonly logger = new Logger(RoadClosureScheduler.name);

  constructor(
    @InjectRepository(RoadClosure)
    private readonly repo: Repository<RoadClosure>,
    private readonly service: RoadClosureService,
  ) {}

  /**
   * Every minute: activate upcoming closures whose startTime has arrived,
   * and resolve active closures whose endTime has passed.
   */
  @Cron('* * * * *')
  async syncClosureStatuses(): Promise<void> {
    const now = new Date();

    // upcoming → active: startTime is in the past, endTime is still in the future
    const toActivate = await this.repo.find({
      where: {
        status: 'upcoming',
        startTime: LessThanOrEqual(now),
        endTime: MoreThanOrEqual(now),
      },
    });

    for (const closure of toActivate) {
      closure.status = 'active';
      await this.repo.save(closure);
      this.logger.log(`Auto-activated road closure: ${closure.title}`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await this.service.notifyRoadClosed(closure);
    }

    // active → resolved: endTime has passed
    const toResolve = await this.repo.find({
      where: {
        status: 'active',
        endTime: LessThanOrEqual(now),
      },
    });

    for (const closure of toResolve) {
      closure.status = 'resolved';
      await this.repo.save(closure);
      this.logger.log(`Auto-resolved road closure: ${closure.title}`);
    }
  }
}
