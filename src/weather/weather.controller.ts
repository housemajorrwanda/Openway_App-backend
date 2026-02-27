import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseFloatPipe,
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
import { WeatherService } from './weather.service';

@ApiTags('Weather')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get weather for a location',
    description:
      'Fetches weather data from OpenWeatherMap for the given coordinates. Results are cached in Redis for 10 minutes.',
  })
  @ApiQuery({ name: 'lat', required: true, type: Number, example: -1.957 })
  @ApiQuery({ name: 'lng', required: true, type: Number, example: 30.092 })
  @ApiResponse({
    status: 200,
    description: 'Current weather data',
    schema: {
      example: {
        temperature: 22.5,
        humidity: 65,
        windSpeed: 12.6,
        visibility: 10.0,
        description: 'Partly cloudy',
        icon: 'partly-cloudy',
        feelsLike: 21.8,
        updatedAt: '2024-01-01T08:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Weather data temporarily unavailable' })
  getWeather(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
  ) {
    return this.weatherService.getWeather(lat, lng);
  }
}
