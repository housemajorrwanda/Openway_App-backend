import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
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
import { UserService } from './user.service';

@ApiTags('User')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the authenticated user\'s profile including their vehicle.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile with vehicle',
    schema: {
      example: {
        id: 'uuid',
        firstName: 'Jean',
        lastName: 'Uwimana',
        email: 'jean@example.com',
        avatarUrl: null,
        vehicle: { make: 'Toyota', model: 'RAV4', licensePlate: 'RAB 123A' },
      },
    },
  })
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.userService.getProfile(user.sub);
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Updates firstName, lastName, and/or avatarUrl.',
  })
  @ApiResponse({ status: 200, description: 'Updated user object' })
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(user.sub, dto);
  }

  @Patch('vehicle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update vehicle details',
    description: 'Updates the user\'s vehicle make, model, and/or license plate.',
  })
  @ApiResponse({ status: 200, description: 'Updated vehicle object' })
  updateVehicle(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.userService.updateVehicle(user.sub, dto);
  }
}
