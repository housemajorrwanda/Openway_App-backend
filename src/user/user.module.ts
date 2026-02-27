import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Vehicle } from '../database/entities/vehicle.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Vehicle])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
