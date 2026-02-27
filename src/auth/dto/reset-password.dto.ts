import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'jean@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp: string;

  @ApiProperty({ example: 'NewPassword1!' })
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[A-Z])(?=.*\d)/, {
    message:
      'newPassword must contain at least one uppercase letter and one number',
  })
  newPassword: string;
}
