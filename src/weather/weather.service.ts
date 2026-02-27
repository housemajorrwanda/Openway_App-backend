import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RedisService } from '../common/redis/redis.service';

interface OWMResponse {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
  visibility: number;
  weather: Array<{ description: string; icon: string; main: string }>;
  dt: number;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Maps OpenWeatherMap icon codes to friendly short names.
   */
  private mapIcon(owmIcon: string): string {
    const map: Record<string, string> = {
      '01d': 'sunny',
      '01n': 'clear-night',
      '02d': 'partly-cloudy',
      '02n': 'partly-cloudy-night',
      '03d': 'cloudy',
      '03n': 'cloudy',
      '04d': 'overcast',
      '04n': 'overcast',
      '09d': 'drizzle',
      '09n': 'drizzle',
      '10d': 'rainy',
      '10n': 'rainy',
      '11d': 'thunderstorm',
      '11n': 'thunderstorm',
      '13d': 'snowy',
      '13n': 'snowy',
      '50d': 'foggy',
      '50n': 'foggy',
    };
    return map[owmIcon] ?? 'unknown';
  }

  async getWeather(lat: number, lng: number) {
    // Round to 2 decimal places for cache key
    const latR = lat.toFixed(2);
    const lngR = lng.toFixed(2);
    const cacheKey = `weather:${latR}:${lngR}`;

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const apiKey = this.configService.get<string>('OPENWEATHER_API_KEY');
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;

    let data: OWMResponse;
    try {
      const response = await axios.get<OWMResponse>(url, { timeout: 8000 });
      data = response.data;
    } catch (err) {
      this.logger.error('Failed to fetch weather from OpenWeatherMap', err);
      throw new InternalServerErrorException({
        error: 'Weather data temporarily unavailable',
        code: 'WEATHER_FETCH_ERROR',
      });
    }

    const result = {
      temperature: Math.round(data.main.temp * 10) / 10,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6 * 10) / 10, // m/s → km/h
      visibility: Math.round((data.visibility / 1000) * 10) / 10, // m → km
      description: data.weather[0]?.description
        ? data.weather[0].description.charAt(0).toUpperCase() +
          data.weather[0].description.slice(1)
        : 'Unknown',
      icon: this.mapIcon(data.weather[0]?.icon ?? ''),
      feelsLike: Math.round(data.main.feels_like * 10) / 10,
      updatedAt: new Date(data.dt * 1000).toISOString(),
    };

    // Cache for 10 minutes
    await this.redisService.set(cacheKey, JSON.stringify(result), 600);

    return result;
  }
}
