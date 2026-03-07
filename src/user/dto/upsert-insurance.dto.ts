import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, MaxLength } from 'class-validator';

export class UpsertInsuranceDto {
  @ApiProperty({ example: 'SONARWA' })
  @IsString()
  @MaxLength(150)
  companyName: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2027-01-01' })
  @IsDateString()
  endDate: string;
}
