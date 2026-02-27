import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('parking_spots')
export class ParkingSpot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'double precision' })
  latitude: number;

  @Column({ type: 'double precision' })
  longitude: number;

  @Column({ name: 'total_spots' })
  totalSpots: number;

  @Column({ name: 'open_spots' })
  openSpots: number;

  @Column({ name: 'price_rwf' })
  priceRwf: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
