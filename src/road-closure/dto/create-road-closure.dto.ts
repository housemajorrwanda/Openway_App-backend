import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoadClosureDto {
  @ApiProperty({ example: 'KG 11 Ave near Remera roundabout', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Road maintenance and pipe repair works' })
  @IsString()
  reason: string;

  @ApiProperty({ example: -1.956, description: 'Start of closed segment (latitude)' })
  @IsNumber()
  startLat: number;

  @ApiProperty({ example: 30.094, description: 'Start of closed segment (longitude)' })
  @IsNumber()
  startLng: number;

  @ApiProperty({ example: -1.958, description: 'End of closed segment (latitude)' })
  @IsNumber()
  endLat: number;

  @ApiProperty({ example: 30.096, description: 'End of closed segment (longitude)' })
  @IsNumber()
  endLng: number;

  @ApiProperty({ example: '2026-03-08T06:00:00.000Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2026-03-08T18:00:00.000Z' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ enum: ['active', 'upcoming', 'resolved'], default: 'upcoming' })
  @IsOptional()
  @IsIn(['active', 'upcoming', 'resolved'])
  status?: 'active' | 'upcoming' | 'resolved';
}
