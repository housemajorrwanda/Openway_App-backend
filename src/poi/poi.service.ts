import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const PLACE_TYPE_MAP: Record<string, string> = {
  gas_station: 'gas_station',
  restaurant: 'restaurant',
  garage: 'car_repair',
};

@Injectable()
export class PoiService {
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY') ?? '';
  }

  async getNearby(lat: number, lng: number, type?: string, radiusMeters: number = 5000) {
    const googleType = type ? PLACE_TYPE_MAP[type] ?? type : undefined;
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    url.searchParams.set('location', `${lat},${lng}`);
    url.searchParams.set('radius', String(radiusMeters));
    url.searchParams.set('key', this.apiKey);
    if (googleType) url.searchParams.set('type', googleType);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new InternalServerErrorException({ error: 'Google Places request failed', code: 'PLACES_ERROR' });
    }

    const data = await res.json() as { status: string; results: GooglePlace[] };

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new InternalServerErrorException({ error: `Google Places error: ${data.status}`, code: 'PLACES_ERROR' });
    }

    return (data.results ?? []).map((place) => ({
      placeId: place.place_id,
      name: place.name,
      type: type ?? this.resolveType(place.types ?? []),
      address: place.vicinity ?? null,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      rating: place.rating ?? null,
      openNow: place.opening_hours?.open_now ?? null,
      icon: place.icon ?? null,
    }));
  }

  private resolveType(types: string[]): string {
    if (types.includes('gas_station')) return 'gas_station';
    if (types.includes('restaurant')) return 'restaurant';
    if (types.includes('car_repair')) return 'garage';
    return types[0] ?? 'unknown';
  }
}

interface GooglePlace {
  place_id: string;
  name: string;
  vicinity?: string;
  types?: string[];
  geometry: { location: { lat: number; lng: number } };
  rating?: number;
  opening_hours?: { open_now: boolean };
  icon?: string;
}
