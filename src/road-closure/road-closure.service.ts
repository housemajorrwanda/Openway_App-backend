import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { RoadClosure } from '../database/entities/road-closure.entity';
import { CreateRoadClosureDto } from './dto/create-road-closure.dto';
import { UpdateRoadClosureDto } from './dto/update-road-closure.dto';

@Injectable()
export class RoadClosureService {
  constructor(
    @InjectRepository(RoadClosure)
    private readonly repo: Repository<RoadClosure>,
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
    return this.repo.save(closure);
  }

  /** Active + upcoming closures for regular users (non-resolved, end time in future) */
  async getActive(): Promise<RoadClosure[]> {
    return this.repo.find({
      where: [
        { status: 'active', endTime: MoreThanOrEqual(new Date()) },
        { status: 'upcoming', endTime: MoreThanOrEqual(new Date()) },
      ],
      order: { startTime: 'ASC' },
    });
  }

  /** All closures — admin view */
  async getAll(): Promise<RoadClosure[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<RoadClosure> {
    const closure = await this.repo.findOne({ where: { id } });
    if (!closure) throw new NotFoundException({ error: 'Road closure not found', code: 'CLOSURE_NOT_FOUND' });
    return closure;
  }

  async update(id: string, dto: UpdateRoadClosureDto): Promise<RoadClosure> {
    const closure = await this.findOne(id);
    if (dto.title !== undefined) closure.title = dto.title;
    if (dto.reason !== undefined) closure.reason = dto.reason;
    if (dto.startLat !== undefined) closure.startLat = dto.startLat;
    if (dto.startLng !== undefined) closure.startLng = dto.startLng;
    if (dto.endLat !== undefined) closure.endLat = dto.endLat;
    if (dto.endLng !== undefined) closure.endLng = dto.endLng;
    if (dto.startTime !== undefined) closure.startTime = new Date(dto.startTime);
    if (dto.endTime !== undefined) closure.endTime = new Date(dto.endTime);
    if (dto.status !== undefined) closure.status = dto.status;
    return this.repo.save(closure);
  }

  async remove(id: string): Promise<void> {
    const closure = await this.findOne(id);
    await this.repo.remove(closure);
  }
}
