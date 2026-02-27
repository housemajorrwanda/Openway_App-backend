import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account with a vehicle and sends a 6-digit OTP to the provided email for verification.',
  })
  @ApiResponse({ status: 201, description: 'OTP sent to email' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email with OTP',
    description:
      'Verifies the user\'s email address using the OTP sent during registration. Returns JWT tokens on success.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified, tokens issued',
    schema: {
      example: {
        accessToken: 'eyJ...',
        refreshToken: 'eyJ...',
        user: {
          id: 'uuid',
          firstName: 'Jean',
          lastName: 'Uwimana',
          email: 'jean@example.com',
          avatarUrl: null,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Authenticates a user and returns JWT access + refresh tokens. If email is unverified, a new OTP is sent.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        accessToken: 'eyJ...',
        refreshToken: 'eyJ...',
        user: {
          id: 'uuid',
          firstName: 'Jean',
          lastName: 'Uwimana',
          email: 'jean@example.com',
          avatarUrl: null,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({
    status: 403,
    description: 'Email not verified — OTP resent',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend OTP',
    description:
      'Resends a verification OTP to the email. Rate limited to 3 requests per 10 minutes.',
  })
  @ApiResponse({ status: 200, description: 'OTP sent' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request a password reset OTP',
    description:
      'Sends a password-reset OTP if the email is registered. Always returns 200 to avoid leaking user existence.',
  })
  @ApiResponse({ status: 200, description: 'Code sent if email exists' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password using OTP',
    description: 'Resets the user password after verifying the OTP code.',
  })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Exchanges a valid refresh token for a new access token.',
  })
  @ApiResponse({ status: 200, description: 'New access token issued' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Logout and blacklist token',
    description: 'Blacklists the current access token in Redis.',
  })
  @ApiResponse({ status: 200, description: 'Logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logout(@Headers('authorization') authHeader: string) {
    const token = authHeader?.replace('Bearer ', '') ?? '';
    return this.authService.logout(token);
  }
}
