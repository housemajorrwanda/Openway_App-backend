import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Vehicle } from '../database/entities/vehicle.entity';
import { FamilyContact } from '../database/entities/family-contact.entity';
import { Insurance } from '../database/entities/insurance.entity';
import { Place } from '../database/entities/place.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Vehicle, FamilyContact, Insurance, Place])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
