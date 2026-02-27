import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  make?: string;

  @ApiPropertyOptional({ example: 'RAV4' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  model?: string;

  @ApiPropertyOptional({ example: 'RAB 123A' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  licensePlate?: string;
}
