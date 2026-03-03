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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TripStatus } from '../database/entities/trip.entity';
import { CompleteTripDto } from './dto/complete-trip.dto';
import { CreateTripDto } from './dto/create-trip.dto';
import { SavePlaceDto } from './dto/save-place.dto';
import { TripService } from './trip.service';

@ApiTags('Trips')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  // ─── Trip CRUD ────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Plan a trip',
    description: 'Creates a new scheduled or immediate trip with origin and destination.',
  })
  @ApiResponse({ status: 201, description: 'Trip created' })
  createTrip(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTripDto,
  ) {
    return this.tripService.createTrip(user.sub, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List trips', description: 'Get all trips, optionally filtered by status.' })
  @ApiQuery({ name: 'status', enum: TripStatus, required: false })
  @ApiResponse({ status: 200, description: 'List of trips' })
  getTrips(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: TripStatus,
  ) {
    return this.tripService.getTrips(user.sub, status);
  }

  @Get('history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Full history',
    description: 'Returns scheduled trips, completed trips, cancelled trips, search history, and favourites in one call.',
  })
  @ApiResponse({ status: 200, description: 'History summary' })
  getHistory(@CurrentUser() user: JwtPayload) {
    return this.tripService.getHistory(user.sub);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single trip' })
  @ApiResponse({ status: 200, description: 'Trip details' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  getTrip(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tripService.getTrip(user.sub, id);
  }

  @Patch(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark trip as started' })
  startTrip(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tripService.startTrip(user.sub, id);
  }

  @Patch(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark trip as completed', description: 'Optionally pass distance and duration.' })
  completeTrip(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteTripDto,
  ) {
    return this.tripService.completeTrip(user.sub, id, dto);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a trip' })
  cancelTrip(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tripService.cancelTrip(user.sub, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a trip' })
  @ApiResponse({ status: 200, description: 'Trip deleted' })
  deleteTrip(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tripService.deleteTrip(user.sub, id);
  }

  // ─── Places ───────────────────────────────────────────────────────────────

  @Post('places')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Save a place',
    description: 'Save a searched location to history or add to favourites.',
  })
  @ApiResponse({ status: 201, description: 'Place saved' })
  savePlace(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SavePlaceDto,
  ) {
    return this.tripService.savePlace(user.sub, dto);
  }

  @Get('places/favourites')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get favourite places' })
  @ApiResponse({ status: 200, description: 'List of favourites' })
  getFavourites(@CurrentUser() user: JwtPayload) {
    return this.tripService.getFavourites(user.sub);
  }

  @Delete('places/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a saved place or remove from favourites' })
  deletePlace(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tripService.deletePlace(user.sub, id);
  }
}
