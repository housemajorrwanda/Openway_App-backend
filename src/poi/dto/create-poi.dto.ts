import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import type { PoiType } from '../../database/entities/point-of-interest.entity';

export class CreatePoiDto {
  @ApiProperty({ example: 'Total Energies Remera' })
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiProperty({ enum: ['gas_station', 'restaurant', 'garage'] })
  @IsIn(['gas_station', 'restaurant', 'garage'])
  type: PoiType;

  @ApiPropertyOptional({ example: 'Full-service fuel station with car wash' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'KG 9 Ave, Remera, Kigali' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty({ example: -1.957 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 30.094 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: '+250788123456' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'Mon-Sun 06:00-22:00' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  openingHours?: string;
}
