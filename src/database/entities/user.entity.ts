import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { FamilyContact } from './family-contact.entity';
import { Insurance } from './insurance.entity';

export type UserRole = 'user' | 'admin';

export interface NotificationPreferences {
  trafficUpdates: boolean;
  weatherChanges: boolean;
  parkingAvailability: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  trafficUpdates: true,
  weatherChanges: true,
  parkingAvailability: true,
};

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name', length: 50 })
  firstName: string;

  @Column({ name: 'last_name', length: 50 })
  lastName: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'expo_push_token', type: 'varchar', length: 200, nullable: true })
  expoPushToken: string | null;

  @Column({ type: 'varchar', length: 10, default: 'user' })
  role: UserRole;

  @Column({
    name: 'notification_prefs',
    type: 'jsonb',
    default: () => `'${JSON.stringify(DEFAULT_NOTIFICATION_PREFS)}'`,
  })
  notificationPrefs: NotificationPreferences;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Vehicle, (vehicle) => vehicle.user, { cascade: true, eager: false })
  vehicle: Vehicle;

  @OneToMany(() => FamilyContact, (fc) => fc.user, { cascade: true })
  familyContacts: FamilyContact[];

  @OneToMany(() => Insurance, (ins) => ins.user, { cascade: true })
  insurances: Insurance[];
}
