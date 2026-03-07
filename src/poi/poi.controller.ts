import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  ParseFloatPipe,
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
import { PoiService } from './poi.service';

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
    description: 'Returns all nearby POIs from Google Places API sorted by distance.',
  })
  @ApiQuery({ name: 'lat', required: true, type: Number, example: -1.957 })
  @ApiQuery({ name: 'lng', required: true, type: Number, example: 30.092 })
  @ApiQuery({ name: 'radius', required: false, type: Number, example: 5000, description: 'Radius in metres (default 5000)' })
  @ApiResponse({ status: 200, description: 'Nearby POIs from Google Places' })
  getNearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius') radius?: string,
  ) {
    return this.service.getNearby(lat, lng, undefined, radius ? parseInt(radius, 10) : 5000);
  }

  @Get('gas-stations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get nearby gas stations via Google Places' })
  @ApiQuery({ name: 'lat', required: true, type: Number, example: -1.957 })
  @ApiQuery({ name: 'lng', required: true, type: Number, example: 30.092 })
  @ApiQuery({ name: 'radius', required: false, type: Number, example: 5000, description: 'Radius in metres (default 5000)' })
  @ApiResponse({ status: 200, description: 'Nearby gas stations' })
  getGasStations(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius') radius?: string,
  ) {
    return this.service.getNearby(lat, lng, 'gas_station', radius ? parseInt(radius, 10) : 5000);
  }

  @Get('restaurants')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get nearby restaurants via Google Places' })
  @ApiQuery({ name: 'lat', required: true, type: Number, example: -1.957 })
  @ApiQuery({ name: 'lng', required: true, type: Number, example: 30.092 })
  @ApiQuery({ name: 'radius', required: false, type: Number, example: 5000, description: 'Radius in metres (default 5000)' })
  @ApiResponse({ status: 200, description: 'Nearby restaurants' })
  getRestaurants(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius') radius?: string,
  ) {
    return this.service.getNearby(lat, lng, 'restaurant', radius ? parseInt(radius, 10) : 5000);
  }

  @Get('garages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get nearby garages / car repair shops via Google Places' })
  @ApiQuery({ name: 'lat', required: true, type: Number, example: -1.957 })
  @ApiQuery({ name: 'lng', required: true, type: Number, example: 30.092 })
  @ApiQuery({ name: 'radius', required: false, type: Number, example: 5000, description: 'Radius in metres (default 5000)' })
  @ApiResponse({ status: 200, description: 'Nearby garages' })
  getGarages(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius') radius?: string,
  ) {
    return this.service.getNearby(lat, lng, 'garage', radius ? parseInt(radius, 10) : 5000);
  }
}
