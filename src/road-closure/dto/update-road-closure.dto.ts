import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateRoadClosureDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  startLat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  startLng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  endLat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  endLng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ enum: ['active', 'upcoming', 'resolved'] })
  @IsOptional()
  @IsIn(['active', 'upcoming', 'resolved'])
  status?: 'active' | 'upcoming' | 'resolved';
}
