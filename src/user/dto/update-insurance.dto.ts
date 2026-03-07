import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateInsuranceDto {
  @ApiPropertyOptional({ example: 'SONARWA' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  companyName?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2027-01-01' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
