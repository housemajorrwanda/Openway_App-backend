import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
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

  @ApiPropertyOptional({ example: 'Pick up kids after school' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
