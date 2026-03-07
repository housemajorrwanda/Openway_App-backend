import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Vehicle } from '../database/entities/vehicle.entity';
import { FamilyContact } from '../database/entities/family-contact.entity';
import { Insurance } from '../database/entities/insurance.entity';
import { Place, PlaceType } from '../database/entities/place.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CreateFamilyContactDto } from './dto/create-family-contact.dto';
import { UpsertInsuranceDto } from './dto/upsert-insurance.dto';
import { UpdateNotificationPrefsDto } from './dto/update-notification-prefs.dto';
import { DEFAULT_NOTIFICATION_PREFS } from '../database/entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(FamilyContact)
    private readonly contactRepo: Repository<FamilyContact>,
    @InjectRepository(Insurance)
    private readonly insuranceRepo: Repository<Insurance>,
    @InjectRepository(Place)
    private readonly placeRepo: Repository<Place>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException({ error: 'User not found', code: 'USER_NOT_FOUND' });

    const [vehicle, familyContacts, insurance] = await Promise.all([
      this.vehicleRepo.findOne({ where: { userId } }),
      this.contactRepo.find({ where: { userId }, order: { createdAt: 'ASC' } }),
      this.insuranceRepo.findOne({ where: { userId } }),
    ]);

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      vehicle: vehicle
        ? { make: vehicle.make, model: vehicle.model, licensePlate: vehicle.licensePlate }
        : null,
      familyContacts: familyContacts.map((c) => ({ id: c.id, name: c.name, phone: c.phone })),
      insurance: insurance
        ? { companyName: insurance.companyName, startDate: insurance.startDate, endDate: insurance.endDate }
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

  async savePushToken(userId: string, token: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException({ error: 'User not found', code: 'USER_NOT_FOUND' });
    user.expoPushToken = token;
    await this.userRepo.save(user);
    return { message: 'Push token saved' };
  }

  async updateVehicle(userId: string, dto: UpdateVehicleDto) {
    const vehicle = await this.vehicleRepo.findOne({ where: { userId } });
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

  // --- Family Contacts -------------------------------------------------------

  async addFamilyContact(userId: string, dto: CreateFamilyContactDto) {
    const contact = this.contactRepo.create({ userId, name: dto.name, phone: dto.phone });
    const saved = await this.contactRepo.save(contact);
    return { id: saved.id, name: saved.name, phone: saved.phone };
  }

  async deleteFamilyContact(userId: string, contactId: string) {
    const contact = await this.contactRepo.findOne({ where: { id: contactId } });
    if (!contact || contact.userId !== userId) {
      throw new NotFoundException({ error: 'Contact not found', code: 'CONTACT_NOT_FOUND' });
    }
    await this.contactRepo.remove(contact);
    return { message: 'Contact deleted' };
  }

  // --- Insurance ------------------------------------------------------------

  async upsertInsurance(userId: string, dto: UpsertInsuranceDto) {
    let insurance = await this.insuranceRepo.findOne({ where: { userId } });
    if (!insurance) {
      insurance = this.insuranceRepo.create({ userId });
    }
    insurance.companyName = dto.companyName;
    insurance.startDate = dto.startDate;
    insurance.endDate = dto.endDate;
    const saved = await this.insuranceRepo.save(insurance);
    return {
      companyName: saved.companyName,
      startDate: saved.startDate,
      endDate: saved.endDate,
    };
  }

  async deleteInsurance(userId: string) {
    const insurance = await this.insuranceRepo.findOne({ where: { userId } });
    if (!insurance) throw new NotFoundException({ error: 'Insurance not found', code: 'INSURANCE_NOT_FOUND' });
    await this.insuranceRepo.remove(insurance);
    return { message: 'Insurance removed' };
  }

  // --- Recent Destinations --------------------------------------------------

  async getRecentDestinations(userId: string) {
    const places = await this.placeRepo.find({
      where: { userId, type: PlaceType.SEARCH },
      order: { createdAt: 'DESC' },
      take: 4,
    });
    return places.map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      latitude: p.latitude,
      longitude: p.longitude,
      visitedAt: p.createdAt,
    }));
  }

  // --- Notification Preferences ---------------------------------------------

  async getNotificationPrefs(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException({ error: 'User not found', code: 'USER_NOT_FOUND' });
    return user.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS;
  }

  async updateNotificationPrefs(userId: string, dto: UpdateNotificationPrefsDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException({ error: 'User not found', code: 'USER_NOT_FOUND' });

    const current = user.notificationPrefs ?? { ...DEFAULT_NOTIFICATION_PREFS };
    if (dto.trafficUpdates !== undefined) current.trafficUpdates = dto.trafficUpdates;
    if (dto.weatherChanges !== undefined) current.weatherChanges = dto.weatherChanges;
    if (dto.parkingAvailability !== undefined) current.parkingAvailability = dto.parkingAvailability;

    user.notificationPrefs = current;
    await this.userRepo.save(user);
    return current;
  }
}
