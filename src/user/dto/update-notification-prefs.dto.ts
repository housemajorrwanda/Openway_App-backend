import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPrefsDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Get notified about traffic congestion on your route',
  })
  @IsOptional()
  @IsBoolean()
  trafficUpdates?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Get notified about weather changes',
  })
  @IsOptional()
  @IsBoolean()
  weatherChanges?: boolean;

  @ApiPropertyOptional({
    example: true,
    description:
      'Get notified when parking spots near your destination become available',
  })
  @IsOptional()
  @IsBoolean()
  parkingAvailability?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Get notified when a road on your route is closed',
  })
  @IsOptional()
  @IsBoolean()
  roadClosures?: boolean;
}
