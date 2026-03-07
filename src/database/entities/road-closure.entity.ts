import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export type ClosureStatus = 'active' | 'upcoming' | 'resolved';

@Entity('road_closures')
export class RoadClosure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Human-readable label, e.g. "KG 11 Ave near Remera roundabout" */
  @Column({ length: 200 })
  title: string;

  /** Reason for closure */
  @Column({ type: 'text' })
  reason: string;

  /** Latitude of road segment start */
  @Column({ name: 'start_lat', type: 'double precision' })
  startLat: number;

  /** Longitude of road segment start */
  @Column({ name: 'start_lng', type: 'double precision' })
  startLng: number;

  /** Latitude of road segment end */
  @Column({ name: 'end_lat', type: 'double precision' })
  endLat: number;

  /** Longitude of road segment end */
  @Column({ name: 'end_lng', type: 'double precision' })
  endLng: number;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime: Date;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'upcoming',
    enum: ['active', 'upcoming', 'resolved'],
  })
  status: ClosureStatus;

  /** Admin who created this closure */
  @Column({ name: 'created_by', nullable: true })
  createdBy: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
