import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class QueryRoadClosureDto {
  @ApiPropertyOptional({
    enum: ['active', 'upcoming', 'resolved'],
    description: 'Filter by closure status. Omit to get active + upcoming.',
  })
  @IsOptional()
  @IsIn(['active', 'upcoming', 'resolved'])
  status?: 'active' | 'upcoming' | 'resolved';

  @ApiPropertyOptional({ example: 0, description: 'Number of records to skip (offset). Default: 0' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @ApiPropertyOptional({ example: 20, description: 'Max records to return. Default: 20, max: 100' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
