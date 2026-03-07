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
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PoiService } from './poi.service';
import { CreatePoiDto } from './dto/create-poi.dto';
import { UpdatePoiDto } from './dto/update-poi.dto';
import type { PoiType } from '../database/entities/point-of-interest.entity';

@ApiTags('Points of Interest')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('poi')
export class PoiController {
  constructor(private readonly service: PoiService) {}

  @Get('nearby')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get nearby gas stations, restaurants, or garages',
    description:
      'Returns POIs near the given coordinates, sorted by distance. Optionally filter by type.',
  })
  @ApiQuery({ name: 'lat', required: true, type: Number, example: -1.957 })
  @ApiQuery({ name: 'lng', required: true, type: Number, example: 30.092 })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['gas_station', 'restaurant', 'garage'],
    description: 'Filter by POI type',
  })
  @ApiQuery({
    name: 'radius',
    required: false,
    type: Number,
    example: 5000,
    description: 'Radius in metres (default 5000)',
  })
  @ApiResponse({
    status: 200,
    description: 'Nearby POIs sorted by distance',
    schema: {
      example: [
        {
          id: 'uuid',
          name: 'Total Energies Remera',
          type: 'gas_station',
          address: 'KG 9 Ave, Remera',
          latitude: -1.957,
          longitude: 30.094,
          phone: '+250788123456',
          openingHours: 'Mon-Sun 06:00-22:00',
          distanceMeters: 320,
        },
      ],
    },
  })
  getNearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('type') type?: string,
    @Query('radius') radius?: string,
  ) {
    const radiusMeters = radius ? parseInt(radius, 10) : 5000;
    return this.service.getNearby(lat, lng, type as PoiType | undefined, radiusMeters);
  }

  // ─── Admin endpoints ───────────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[Admin] Add a new point of interest' })
  create(@Body() dto: CreatePoiDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Update a point of interest' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePoiDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Delete a point of interest' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
