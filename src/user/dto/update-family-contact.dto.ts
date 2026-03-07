import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateFamilyContactDto {
  @ApiPropertyOptional({ example: 'Marie Uwimana' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: '+250788000000' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
