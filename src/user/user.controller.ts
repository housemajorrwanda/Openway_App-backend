import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { SavePushTokenDto } from './dto/save-push-token.dto';
import { CreateFamilyContactDto } from './dto/create-family-contact.dto';
import { UpdateFamilyContactDto } from './dto/update-family-contact.dto';
import { UpsertInsuranceDto } from './dto/upsert-insurance.dto';
import { UpdateInsuranceDto } from './dto/update-insurance.dto';
import { UpdateNotificationPrefsDto } from './dto/update-notification-prefs.dto';
import { UserService } from './user.service';

@ApiTags('User')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // --- Profile --------------------------------------------------------------

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the authenticated user profile including vehicle, family contacts, and insurance.',
  })
  @ApiResponse({
    status: 200,
    description: 'Full user profile',
    schema: {
      example: {
        id: 'uuid',
        firstName: 'Jean',
        lastName: 'Uwimana',
        email: 'jean@example.com',
        avatarUrl: null,
        role: 'user',
        vehicle: { make: 'Toyota', model: 'RAV4', licensePlate: 'RAB 123A' },
        familyContacts: [{ id: 'uuid', name: 'Marie', phone: '+250788000000' }],
        insurances: [{ id: 'uuid', companyName: 'SONARWA', startDate: '2026-01-01', endDate: '2027-01-01' }],
      },
    },
  })
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.userService.getProfile(user.sub);
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile (name, avatar)' })
  @ApiResponse({ status: 200, description: 'Updated user object' })
  updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(user.sub, dto);
  }

  @Patch('push-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save Expo push token' })
  @ApiResponse({ status: 200, description: 'Push token saved' })
  savePushToken(@CurrentUser() user: JwtPayload, @Body() dto: SavePushTokenDto) {
    return this.userService.savePushToken(user.sub, dto.token);
  }

  @Patch('vehicle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update vehicle details' })
  @ApiResponse({ status: 200, description: 'Updated vehicle object' })
  updateVehicle(@CurrentUser() user: JwtPayload, @Body() dto: UpdateVehicleDto) {
    return this.userService.updateVehicle(user.sub, dto);
  }

  // --- Recent destinations --------------------------------------------------

  @Get('recent-destinations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get top 4 recent destinations',
    description: 'Returns the 4 most recently searched or navigated destinations for this user.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: [
        { id: 'uuid', name: 'Kimironko Market', address: null, latitude: -1.94, longitude: 30.1, visitedAt: '2026-03-07T10:00:00Z' },
      ],
    },
  })
  getRecentDestinations(@CurrentUser() user: JwtPayload) {
    return this.userService.getRecentDestinations(user.sub);
  }

  // --- Family Contacts -------------------------------------------------------

  @Post('family-contacts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a family / alternative contact',
    description: 'Adds a contact (name + phone number) to the user profile.',
  })
  @ApiResponse({ status: 201, schema: { example: { id: 'uuid', name: 'Marie', phone: '+250788000000' } } })
  addFamilyContact(@CurrentUser() user: JwtPayload, @Body() dto: CreateFamilyContactDto) {
    return this.userService.addFamilyContact(user.sub, dto);
  }

  @Patch('family-contacts/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a family contact' })
  @ApiResponse({ status: 200, schema: { example: { id: 'uuid', name: 'Marie', phone: '+250788000000' } } })
  updateFamilyContact(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) contactId: string,
    @Body() dto: UpdateFamilyContactDto,
  ) {
    return this.userService.updateFamilyContact(user.sub, contactId, dto);
  }

  @Delete('family-contacts/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a family contact' })
  @ApiResponse({ status: 200, schema: { example: { message: 'Contact deleted' } } })
  deleteFamilyContact(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) contactId: string,
  ) {
    return this.userService.deleteFamilyContact(user.sub, contactId);
  }

  // --- Insurance ------------------------------------------------------------

  @Get('insurance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all insurance records' })
  @ApiResponse({
    status: 200,
    schema: { example: [{ id: 'uuid', companyName: 'SONARWA', startDate: '2026-01-01', endDate: '2027-01-01' }] },
  })
  getInsurances(@CurrentUser() user: JwtPayload) {
    return this.userService.getInsurances(user.sub);
  }

  @Post('insurance')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add an insurance record' })
  @ApiResponse({
    status: 201,
    schema: { example: { id: 'uuid', companyName: 'SONARWA', startDate: '2026-01-01', endDate: '2027-01-01' } },
  })
  addInsurance(@CurrentUser() user: JwtPayload, @Body() dto: UpsertInsuranceDto) {
    return this.userService.addInsurance(user.sub, dto);
  }

  @Patch('insurance/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an insurance record' })
  @ApiResponse({
    status: 200,
    schema: { example: { id: 'uuid', companyName: 'SONARWA', startDate: '2026-01-01', endDate: '2027-01-01' } },
  })
  updateInsurance(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) insuranceId: string,
    @Body() dto: UpdateInsuranceDto,
  ) {
    return this.userService.updateInsurance(user.sub, insuranceId, dto);
  }

  @Delete('insurance/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an insurance record' })
  @ApiResponse({ status: 200, schema: { example: { message: 'Insurance removed' } } })
  deleteInsurance(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) insuranceId: string,
  ) {
    return this.userService.deleteInsurance(user.sub, insuranceId);
  }

  // --- Notification Preferences (Settings) ----------------------------------

  @Get('settings/notifications')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get notification preferences',
    description: 'Returns the current notification toggle settings for the user.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        trafficUpdates: true,
        weatherChanges: true,
        parkingAvailability: true,
      },
    },
  })
  getNotificationPrefs(@CurrentUser() user: JwtPayload) {
    return this.userService.getNotificationPrefs(user.sub);
  }

  @Patch('settings/notifications')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update notification preferences',
    description: 'Toggle traffic, weather, and parking notifications on or off. Send only the fields you want to change.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        trafficUpdates: false,
        weatherChanges: true,
        parkingAvailability: true,
      },
    },
  })
  updateNotificationPrefs(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateNotificationPrefsDto,
  ) {
    return this.userService.updateNotificationPrefs(user.sub, dto);
  }
}
