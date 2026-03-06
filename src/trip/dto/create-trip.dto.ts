import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateTripDto {
  @ApiProperty({ example: -1.9441, description: "User's current latitude (GPS)" })
  @IsLatitude()
  originLat: number;

  @ApiProperty({ example: 30.0619, description: "User's current longitude (GPS)" })
  @IsLongitude()
  originLng: number;

  @ApiProperty({ example: 'Kigali Convention Centre', description: 'Destination place name' })
  @IsString()
  @MaxLength(255)
  destinationName: string;

  @ApiProperty({ example: -1.9536, description: 'Destination latitude' })
  @IsLatitude()
  destinationLat: number;

  @ApiProperty({ example: 30.0946, description: 'Destination longitude' })
  @IsLongitude()
  destinationLng: number;

  @ApiPropertyOptional({
    example: '08:30',
    description: "Departure time in HH:mm (24h format). Backend combines with today's date. Omit for immediate trip.",
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'departureTime must be HH:mm (e.g. 08:30)' })
  departureTime?: string;

  @ApiPropertyOptional({ example: 'Pick up kids after school' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
