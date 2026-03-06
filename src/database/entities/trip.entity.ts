import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum TripStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('trips')
@Index(['userId', 'status'])
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  // Origin (user's current GPS location at trip creation)
  @Column({ name: 'origin_lat', type: 'decimal', precision: 10, scale: 7 })
  originLat: number;

  @Column({ name: 'origin_lng', type: 'decimal', precision: 10, scale: 7 })
  originLng: number;

  // Destination
  @Column({ name: 'destination_name', length: 255 })
  destinationName: string;

  @Column({ name: 'destination_lat', type: 'decimal', precision: 10, scale: 7 })
  destinationLat: number;

  @Column({ name: 'destination_lng', type: 'decimal', precision: 10, scale: 7 })
  destinationLng: number;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  // Metadata
  @Column({
    type: 'enum',
    enum: TripStatus,
    default: TripStatus.SCHEDULED,
  })
  status: TripStatus;

  @Column({ name: 'distance_km', type: 'decimal', precision: 8, scale: 2, nullable: true })
  distanceKm: number | null;

  @Column({ name: 'duration_min', type: 'int', nullable: true })
  durationMin: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
