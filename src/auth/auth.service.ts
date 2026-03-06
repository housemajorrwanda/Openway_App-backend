import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { LessThan, Repository } from 'typeorm';
import { EmailService } from '../common/email/email.service';
import { Otp } from '../database/entities/otp.entity';
import { TokenBlacklist } from '../database/entities/token-blacklist.entity';
import { User } from '../database/entities/user.entity';
import { Vehicle } from '../database/entities/vehicle.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(TokenBlacklist)
    private readonly blacklistRepo: Repository<TokenBlacklist>,
    @InjectRepository(Otp)
    private readonly otpRepo: Repository<Otp>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private issueTokens(userId: string, email: string) {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!jwtSecret || !refreshSecret) {
      throw new InternalServerErrorException({
        error: 'JWT secrets are not configured',
        code: 'MISSING_JWT_SECRET',
      });
    }
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: '7d',
    });
    return { accessToken, refreshToken };
  }

  private userResponse(user: User) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl,
    };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async saveAndSendOtp(
    email: string,
    purpose: 'verify' | 'reset',
  ): Promise<void> {
    // Delete any existing OTPs for this email+purpose
    await this.otpRepo.delete({ email, purpose });

    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.otpRepo.save(this.otpRepo.create({ email, code, purpose, expiresAt }));
    await this.emailService.sendOtp(email, code, purpose);
  }

  // ─── Register ─────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException({
        error: 'Email already registered',
        code: 'EMAIL_EXISTS',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      passwordHash,
      isVerified: false,
    });
    const savedUser = await this.userRepo.save(user);

    const vehicle = this.vehicleRepo.create({
      userId: savedUser.id,
      make: dto.vehicleMake,
      model: dto.vehicleModel,
      licensePlate: dto.licensePlate ?? null,
    });
    await this.vehicleRepo.save(vehicle);

    await this.saveAndSendOtp(dto.email, 'verify');

    return { message: 'Registration successful. Check your email for the verification code.' };
  }

  // ─── Verify OTP ───────────────────────────────────────────────────────────

  async verifyOtp(dto: VerifyOtpDto) {
    const otp = await this.otpRepo.findOne({
      where: { email: dto.email, purpose: 'verify' },
    });

    if (!otp || otp.code !== dto.otp) {
      throw new BadRequestException({
        error: 'Invalid OTP',
        code: 'INVALID_OTP',
      });
    }

    if (otp.expiresAt < new Date()) {
      await this.otpRepo.delete({ id: otp.id });
      throw new BadRequestException({
        error: 'OTP has expired',
        code: 'OTP_EXPIRED',
      });
    }

    await this.otpRepo.delete({ id: otp.id });

    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new NotFoundException({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    user.isVerified = true;
    await this.userRepo.save(user);

    const tokens = this.issueTokens(user.id, user.email);
    return { ...tokens, user: this.userResponse(user) };
  }

  // ─── Resend OTP ───────────────────────────────────────────────────────────

  async resendOtp(dto: ResendOtpDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new NotFoundException({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    if (user.isVerified) {
      throw new BadRequestException({
        error: 'Email already verified',
        code: 'ALREADY_VERIFIED',
      });
    }

    await this.saveAndSendOtp(dto.email, 'verify');
    return { message: 'Verification code resent. Check your email.' };
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    if (!user.isVerified) {
      await this.saveAndSendOtp(user.email, 'verify');
      throw new UnauthorizedException({
        error: 'Email not verified. A new verification code has been sent.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    const tokens = this.issueTokens(user.id, user.email);
    return { ...tokens, user: this.userResponse(user) };
  }

  // ─── Forgot Password ──────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If that email exists, a reset code has been sent.' };
    }

    await this.saveAndSendOtp(dto.email, 'reset');
    return { message: 'If that email exists, a reset code has been sent.' };
  }

  // ─── Reset Password ───────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto) {
    const otp = await this.otpRepo.findOne({
      where: { email: dto.email, purpose: 'reset' },
    });

    if (!otp || otp.code !== dto.otp) {
      throw new BadRequestException({
        error: 'Invalid OTP',
        code: 'INVALID_OTP',
      });
    }

    if (otp.expiresAt < new Date()) {
      await this.otpRepo.delete({ id: otp.id });
      throw new BadRequestException({
        error: 'OTP has expired',
        code: 'OTP_EXPIRED',
      });
    }

    await this.otpRepo.delete({ id: otp.id });

    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new NotFoundException({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepo.save(user);

    return { message: 'Password reset successful. You can now log in.' };
  }

  // ─── Refresh Token ────────────────────────────────────────────────────────

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string; email: string }>(
        token,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );

      const accessToken = this.jwtService.sign(
        { sub: payload.sub, email: payload.email },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: '15m',
        },
      );

      return { accessToken };
    } catch {
      throw new UnauthorizedException({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout(token: string) {
    try {
      const payload = this.jwtService.decode<{ exp: number }>(token);
      if (payload?.exp) {
        const expiresAt = new Date(payload.exp * 1000);
        if (expiresAt > new Date()) {
          await this.blacklistRepo.upsert(
            { token, expiresAt },
            { conflictPaths: ['token'] },
          );
          await this.blacklistRepo.delete({ expiresAt: LessThan(new Date()) });
        }
      }
    } catch {
      // Ignore errors on logout
    }
    return { message: 'Logged out' };
  }
}
