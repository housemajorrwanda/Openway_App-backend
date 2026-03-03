import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum PlaceType {
  SEARCH = 'search',
  FAVOURITE = 'favourite',
}

@Entity('places')
@Index(['userId', 'type'])
export class Place {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 500, nullable: true })
  address: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'enum', enum: PlaceType, default: PlaceType.SEARCH })
  type: PlaceType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
