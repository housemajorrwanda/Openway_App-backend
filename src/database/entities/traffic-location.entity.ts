import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TrafficLevel = 'low' | 'medium' | 'high';

@Entity('traffic_locations')
export class TrafficLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({
    type: 'varchar',
    length: 10,
    enum: ['low', 'medium', 'high'],
  })
  level: TrafficLevel;

  @Column({ type: 'double precision' })
  latitude: number;

  @Column({ type: 'double precision' })
  longitude: number;

  // Google Distance Matrix enriched fields (nullable — populated after first cron run)
  @Column({ type: 'double precision', nullable: true, name: 'distance_km' })
  distanceKm: number | null;

  @Column({ type: 'int', nullable: true, name: 'duration_minutes' })
  durationMinutes: number | null;

  @Column({ type: 'int', nullable: true, name: 'duration_in_traffic_minutes' })
  durationInTrafficMinutes: number | null;

  @Column({ type: 'int', nullable: true, name: 'delay_minutes' })
  delayMinutes: number | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
