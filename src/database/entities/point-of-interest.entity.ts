import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type PoiType = 'gas_station' | 'restaurant' | 'garage';

@Entity('points_of_interest')
export class PointOfInterest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({
    type: 'varchar',
    length: 20,
    enum: ['gas_station', 'restaurant', 'garage'],
  })
  type: PoiType;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Street address or landmark reference */
  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'double precision' })
  latitude: number;

  @Column({ type: 'double precision' })
  longitude: number;

  /** E.g. phone number */
  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  /** Opening hours, free-form e.g. "Mon-Sat 07:00-21:00" */
  @Column({ name: 'opening_hours', type: 'varchar', length: 100, nullable: true })
  openingHours: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
