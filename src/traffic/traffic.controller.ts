import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TrafficService } from './traffic.service';

@ApiTags('Traffic')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('traffic')
export class TrafficController {
  constructor(private readonly trafficService: TrafficService) {}

  @Get('locations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get nearby Kigali traffic locations',
    description:
      'Returns traffic hotspots sorted by distance from the user. Pass lat/lng to get distance-aware results filtered within radiusKm (default 15 km). Without lat/lng all locations are returned.',
  })
  @ApiQuery({
    name: 'lat',
    required: false,
    type: Number,
    description: 'User latitude',
  })
  @ApiQuery({
    name: 'lng',
    required: false,
    type: Number,
    description: 'User longitude',
  })
  @ApiQuery({
    name: 'radiusKm',
    required: false,
    type: Number,
    description: 'Search radius in km (default 15)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of traffic locations sorted by distance',
    schema: {
      example: {
        locations: [
          {
            id: 'uuid',
            name: 'Gisimenti',
            level: 'high',
            latitude: -1.956,
            longitude: 30.0939,
            distanceFromUserKm: 1.2,
            distanceKm: 6.8,
            durationMinutes: 14,
            durationInTrafficMinutes: 22,
            delayMinutes: 8,
            updatedAt: '2024-01-01T08:00:00.000Z',
          },
        ],
      },
    },
  })
  getLocations(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radiusKm') radiusKm?: string,
  ) {
    const userLat = lat != null ? parseFloat(lat) : undefined;
    const userLng = lng != null ? parseFloat(lng) : undefined;
    const radius = radiusKm != null ? parseFloat(radiusKm) : 15;
    return this.trafficService.getLocations(userLat, userLng, radius);
  }
}
