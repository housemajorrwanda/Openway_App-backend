/* eslint-disable @typescript-eslint/no-unsafe-call */
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

  @Get('route')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get traffic along a route',
    description:
      'Returns traffic hotspots that fall within a corridor along the straight line from origin to destination. Hotspots are ordered from origin to destination.',
  })
  @ApiQuery({
    name: 'originLat',
    required: true,
    type: Number,
    example: -1.9441,
  })
  @ApiQuery({
    name: 'originLng',
    required: true,
    type: Number,
    example: 30.0619,
  })
  @ApiQuery({
    name: 'destLat',
    required: true,
    type: Number,
    example: -1.9536,
  })
  @ApiQuery({
    name: 'destLng',
    required: true,
    type: Number,
    example: 30.0946,
  })
  @ApiQuery({
    name: 'corridorKm',
    required: false,
    type: Number,
    description: 'Max distance from route line in km (default 2)',
  })
  @ApiResponse({
    status: 200,
    description: 'Traffic hotspots along the route',
    schema: {
      example: {
        worstLevel: 'high',
        totalDelayMinutes: 15,
        dataReady: true,
        hotspots: [
          {
            id: 'uuid',
            name: 'Nyabugogo',
            level: 'high',
            latitude: -1.9344,
            longitude: 30.0544,
            distanceFromRouteKm: 0.3,
            distanceFromOriginKm: 1.1,
            delayMinutes: 15,
          },
        ],
      },
    },
  })
  getRouteTraffic(
    @Query('originLat') originLat: string,
    @Query('originLng') originLng: string,
    @Query('destLat') destLat: string,
    @Query('destLng') destLng: string,
    @Query('corridorKm') corridorKm?: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.trafficService.getRouteTraffic(
      parseFloat(originLat),
      parseFloat(originLng),
      parseFloat(destLat),
      parseFloat(destLng),
      corridorKm != null ? parseFloat(corridorKm) : 2,
    );
  }
}
