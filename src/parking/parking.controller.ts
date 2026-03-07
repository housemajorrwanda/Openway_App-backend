import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFloatPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsNumber, IsString, MaxLength, Min } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParkingService } from './parking.service';
import { UpdateParkingDto } from './dto/update-parking.dto';

class CreateParkingSpotDto {
  @ApiProperty({ example: 'Kimihurura Parking' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: -1.957 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 30.092 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: 80 })
  @IsNumber()
  @Min(1)
  totalSpots: number;

  @ApiProperty({ example: 40 })
  @IsNumber()
  @Min(0)
  openSpots: number;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0)
  priceRwf: number;
}

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

  // ─── Admin endpoints ───────────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[Admin] Add a new parking spot' })
  @ApiBody({ type: CreateParkingSpotDto })
  createSpot(@Body() dto: CreateParkingSpotDto) {
    return this.parkingService.createSpot(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Update parking spot (open spots, price, etc.)' })
  updateSpot(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateParkingDto,
  ) {
    return this.parkingService.updateSpot(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Delete a parking spot' })
  deleteSpot(@Param('id', ParseUUIDPipe) id: string) {
    return this.parkingService.deleteSpot(id);
  }
}
