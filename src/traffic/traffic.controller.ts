import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
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
    summary: 'Get all Kigali traffic locations',
    description:
      'Returns all monitored traffic locations in Kigali with their current congestion level (low / medium / high).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of traffic locations',
    schema: {
      example: {
        locations: [
          {
            id: 'uuid',
            name: 'Gisimenti',
            level: 'high',
            latitude: -1.956,
            longitude: 30.0939,
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
  getLocations() {
    return this.trafficService.getLocations();
  }
}
