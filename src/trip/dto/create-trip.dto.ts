import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTripDto {
  @ApiProperty({ example: 'Home', description: 'Origin place name' })
  @IsString()
  @MaxLength(255)
  originName: string;

  @ApiPropertyOptional({ example: 'KG 123 St, Kigali' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  originAddress?: string;

  @ApiProperty({ example: -1.9441 })
  @IsLatitude()
  originLat: number;

  @ApiProperty({ example: 30.0619 })
  @IsLongitude()
  originLng: number;

  @ApiProperty({ example: 'Kigali Convention Centre' })
  @IsString()
  @MaxLength(255)
  destinationName: string;

  @ApiPropertyOptional({ example: 'KG 2 Roundabout, Kigali' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  destinationAddress?: string;

  @ApiProperty({ example: -1.9536 })
  @IsLatitude()
  destinationLat: number;

  @ApiProperty({ example: 30.0946 })
  @IsLongitude()
  destinationLng: number;

  @ApiPropertyOptional({
    example: '2025-03-05T08:00:00Z',
    description: 'When to depart (ISO 8601). Omit for immediate/unscheduled.',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ example: 'Pick up kids after school' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
