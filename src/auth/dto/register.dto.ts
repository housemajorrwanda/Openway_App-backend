import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Jean', description: 'First name' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Uwimana', description: 'Last name' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: 'jean@example.com', description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password1!',
    description: 'Min 8 chars, 1 uppercase, 1 number',
  })
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[A-Z])(?=.*\d)/, {
    message:
      'password must contain at least one uppercase letter and one number',
  })
  password: string;

  @ApiProperty({ example: 'Toyota', description: 'Vehicle make' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  vehicleMake: string;

  @ApiProperty({ example: 'RAV4', description: 'Vehicle model' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  vehicleModel: string;

  @ApiPropertyOptional({ example: 'RAB 123A', description: 'License plate' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  licensePlate?: string;
}
