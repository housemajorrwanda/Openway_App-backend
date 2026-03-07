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
    summary: 'Get all nearby POIs (gas stations, restaurants, garages)',
    description: 'Returns all POI types near the given coordinates, sorted by distance.',
  })
  @ApiQuery({ name: 'lat', required: true, type: Number, example: -1.957 })
  @ApiQuery({ name: 'lng', required: true, type: Number, example: 30.092 })
  @ApiQuery({
    name: 'radius',
    required: false,
    type: Number,
    example: 5000,
    description: 'Radius in metres (default 5000)',
  })
  @ApiResponse({ status: 200, description: 'Nearby POIs sorted by distance' })
  getNearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius') radius?: string,
  ) {
    const radiusMeters = radius ? parseInt(radius, 10) : 5000;
    return this.service.getNearby(lat, lng, undefined, radiusMeters);
  }

  @Get('gas-stations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get nearby gas stations' })
  @ApiQuery({ name: 'lat', required: true, type: Number, example: -1.957 })
  @ApiQuery({ name: 'lng', required: true, type: Number, example: 30.092 })
  @ApiQuery({ name: 'radius', required: false, type: Number, example: 5000, description: 'Radius in metres (default 5000)' })
  @ApiResponse({ status: 200, description: 'Nearby gas stations sorted by distance' })
  getGasStations(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius') radius?: string,
  ) {
    const radiusMeters = radius ? parseInt(radius, 10) : 5000;
    return this.service.getNearby(lat, lng, 'gas_station', radiusMeters);
  }

  @Get('restaurants')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get nearby restaurants' })
  @ApiQuery({ name: 'lat', required: true, type: Number, example: -1.957 })
  @ApiQuery({ name: 'lng', required: true, type: Number, example: 30.092 })
  @ApiQuery({ name: 'radius', required: false, type: Number, example: 5000, description: 'Radius in metres (default 5000)' })
  @ApiResponse({ status: 200, description: 'Nearby restaurants sorted by distance' })
  getRestaurants(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius') radius?: string,
  ) {
    const radiusMeters = radius ? parseInt(radius, 10) : 5000;
    return this.service.getNearby(lat, lng, 'restaurant', radiusMeters);
  }

  @Get('garages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get nearby garages / car repair shops' })
  @ApiQuery({ name: 'lat', required: true, type: Number, example: -1.957 })
  @ApiQuery({ name: 'lng', required: true, type: Number, example: 30.092 })
  @ApiQuery({ name: 'radius', required: false, type: Number, example: 5000, description: 'Radius in metres (default 5000)' })
  @ApiResponse({ status: 200, description: 'Nearby garages sorted by distance' })
  getGarages(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius') radius?: string,
  ) {
    const radiusMeters = radius ? parseInt(radius, 10) : 5000;
    return this.service.getNearby(lat, lng, 'garage', radiusMeters);
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
