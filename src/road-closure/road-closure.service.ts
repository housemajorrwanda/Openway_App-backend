import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { RoadClosure } from '../database/entities/road-closure.entity';
import { CreateRoadClosureDto } from './dto/create-road-closure.dto';
import { UpdateRoadClosureDto } from './dto/update-road-closure.dto';
import { QueryRoadClosureDto } from './dto/query-road-closure.dto';
import { NotificationService } from '../common/notifications/notification.service';

@Injectable()
export class RoadClosureService {
  constructor(
    @InjectRepository(RoadClosure)
    private readonly repo: Repository<RoadClosure>,
    private readonly notifications: NotificationService,
  ) {}

  async create(adminId: string, dto: CreateRoadClosureDto): Promise<RoadClosure> {
    const closure = this.repo.create({
      title: dto.title,
      reason: dto.reason,
      startLat: dto.startLat,
      startLng: dto.startLng,
      endLat: dto.endLat,
      endLng: dto.endLng,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      status: dto.status ?? 'upcoming',
      createdBy: adminId,
    });
    const saved = await this.repo.save(closure);

    if (saved.status === 'active') {
      await this.notifyRoadClosed(saved);
    }

    return saved;
  }

  /** Active + upcoming closures for regular users, with optional status filter + pagination */
  async getActive(query: QueryRoadClosureDto): Promise<{ data: RoadClosure[]; total: number }> {
    const skip = query.skip ?? 0;
    const limit = Math.min(query.limit ?? 20, 100);
    const now = new Date();

    const where = query.status
      ? query.status === 'resolved'
        ? [{ status: 'resolved' as const }]
        : [{ status: query.status as 'active' | 'upcoming', endTime: MoreThanOrEqual(now) }]
      : [
          { status: 'active' as const, endTime: MoreThanOrEqual(now) },
          { status: 'upcoming' as const, endTime: MoreThanOrEqual(now) },
        ];

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { startTime: 'ASC' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  /** All closures — admin view with optional status filter + pagination */
  async getAll(query: QueryRoadClosureDto): Promise<{ data: RoadClosure[]; total: number }> {
    const skip = query.skip ?? 0;
    const limit = Math.min(query.limit ?? 20, 100);

    const [data, total] = await this.repo.findAndCount({
      ...(query.status ? { where: { status: query.status } } : {}),
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  async findOne(id: string): Promise<RoadClosure> {
    const closure = await this.repo.findOne({ where: { id } });
    if (!closure) throw new NotFoundException({ error: 'Road closure not found', code: 'CLOSURE_NOT_FOUND' });
    return closure;
  }

  async update(id: string, dto: UpdateRoadClosureDto): Promise<RoadClosure> {
    const closure = await this.findOne(id);
    const previousStatus = closure.status;

    if (dto.title !== undefined) closure.title = dto.title;
    if (dto.reason !== undefined) closure.reason = dto.reason;
    if (dto.startLat !== undefined) closure.startLat = dto.startLat;
    if (dto.startLng !== undefined) closure.startLng = dto.startLng;
    if (dto.endLat !== undefined) closure.endLat = dto.endLat;
    if (dto.endLng !== undefined) closure.endLng = dto.endLng;
    if (dto.startTime !== undefined) closure.startTime = new Date(dto.startTime);
    if (dto.endTime !== undefined) closure.endTime = new Date(dto.endTime);
    if (dto.status !== undefined) closure.status = dto.status;

    const saved = await this.repo.save(closure);

    // Notify only when transitioning INTO active (not on every update)
    if (saved.status === 'active' && previousStatus !== 'active') {
      await this.notifyRoadClosed(saved);
    } else if (saved.status === 'resolved' && previousStatus === 'active') {
      await this.notifyRoadReopened(saved);
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    const closure = await this.findOne(id);
    await this.repo.remove(closure);
  }

  /** Broadcast push notification when a road goes active (closed NOW) */
  async notifyRoadClosed(closure: RoadClosure): Promise<void> {
    await this.notifications.broadcast(
      {
        title: '🚧 Road Closed',
        body: `${closure.title} is now closed. ${closure.reason}`,
        data: {
          type: 'ROAD_CLOSURE_ACTIVE',
          closureId: closure.id,
          startLat: closure.startLat,
          startLng: closure.startLng,
          endLat: closure.endLat,
          endLng: closure.endLng,
        },
      },
      'roadClosures',
    );
  }

  /** Broadcast when a road reopens */
  private async notifyRoadReopened(closure: RoadClosure): Promise<void> {
    await this.notifications.broadcast(
      {
        title: '✅ Road Reopened',
        body: `${closure.title} is now open again.`,
        data: {
          type: 'ROAD_CLOSURE_RESOLVED',
          closureId: closure.id,
        },
      },
      'roadClosures',
    );
  }
}
