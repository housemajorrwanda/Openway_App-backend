import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseFloatPipe,
  ParseIntPipe,
  Query,
  UseGuards,
  Optional,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ParkingService } from './parking.service';

@ApiTags('Parking')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('parking')
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) {}

  @Get('nearby')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get nearby parking spots',
    description:
      'Returns parking spots sorted by distance from the given coordinates. Uses the Haversine formula to compute distance.',
  })
  @ApiQuery({ name: 'lat', required: true, type: Number, example: -1.957 })
  @ApiQuery({ name: 'lng', required: true, type: Number, example: 30.092 })
  @ApiQuery({
    name: 'radius',
    required: false,
    type: Number,
    example: 5000,
    description: 'Search radius in metres (default 5000)',
  })
  @ApiResponse({
    status: 200,
    description: 'Nearby parking spots sorted by distance',
    schema: {
      example: {
        spots: [
          {
            id: 'uuid',
            name: 'KBC Arena Parking',
            latitude: -1.957,
            longitude: 30.092,
            openSpots: 24,
            totalSpots: 50,
            priceRwfPerHour: 500,
            distanceMeters: 0,
            availabilityPercent: 48,
          },
        ],
      },
    },
  })
  getNearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius') radius?: string,
  ) {
    const radiusMeters = radius ? parseInt(radius, 10) : 5000;
    return this.parkingService.getNearby(lat, lng, radiusMeters);
  }
}
