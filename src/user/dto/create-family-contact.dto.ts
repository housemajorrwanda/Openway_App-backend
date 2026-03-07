import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateFamilyContactDto {
  @ApiProperty({ example: 'Marie Uwimana' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '+250788000000' })
  @IsString()
  @MaxLength(30)
  phone: string;
}
