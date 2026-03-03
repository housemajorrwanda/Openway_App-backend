import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class CompleteTripDto {
  @ApiPropertyOptional({ example: 5.4, description: 'Distance travelled in km' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceKm?: number;

  @ApiPropertyOptional({ example: 18, description: 'Duration in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMin?: number;
}
