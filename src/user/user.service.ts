import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Vehicle } from '../database/entities/vehicle.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException({ error: 'User not found', code: 'USER_NOT_FOUND' });

    const vehicle = await this.vehicleRepo.findOne({ where: { userId } });

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      vehicle: vehicle
        ? { make: vehicle.make, model: vehicle.model, licensePlate: vehicle.licensePlate }
        : null,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException({ error: 'User not found', code: 'USER_NOT_FOUND' });

    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;

    const saved = await this.userRepo.save(user);

    return {
      id: saved.id,
      firstName: saved.firstName,
      lastName: saved.lastName,
      email: saved.email,
      avatarUrl: saved.avatarUrl,
    };
  }

  async updateVehicle(userId: string, dto: UpdateVehicleDto) {
    let vehicle = await this.vehicleRepo.findOne({ where: { userId } });
    if (!vehicle) {
      throw new NotFoundException({ error: 'Vehicle not found', code: 'VEHICLE_NOT_FOUND' });
    }

    if (dto.make !== undefined) vehicle.make = dto.make;
    if (dto.model !== undefined) vehicle.model = dto.model;
    if (dto.licensePlate !== undefined) vehicle.licensePlate = dto.licensePlate;

    const saved = await this.vehicleRepo.save(vehicle);

    return {
      id: saved.id,
      make: saved.make,
      model: saved.model,
      licensePlate: saved.licensePlate,
    };
  }
}
