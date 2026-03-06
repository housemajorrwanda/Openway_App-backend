import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 50 })
  make: string;

  @Column({ length: 50 })
  model: string;

  @Column({ name: 'license_plate', type: 'varchar', length: 20, nullable: true, unique: true })
  licensePlate: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => User, (user) => user.vehicle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
