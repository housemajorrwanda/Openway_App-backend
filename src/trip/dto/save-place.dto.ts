import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PlaceType } from '../../database/entities/place.entity';

export class SavePlaceDto {
  @ApiProperty({ example: 'Kimironko Market' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Kimironko, Kigali' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiProperty({ example: -1.9355 })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: 30.1035 })
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({
    enum: PlaceType,
    default: PlaceType.SEARCH,
    description: '"search" = history entry, "favourite" = saved favourite',
  })
  @IsOptional()
  @IsEnum(PlaceType)
  type?: PlaceType;
}
