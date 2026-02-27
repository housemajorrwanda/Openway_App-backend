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

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
