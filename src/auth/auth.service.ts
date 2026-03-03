import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { EmailService } from '../common/email/email.service';
import { RedisService } from '../common/redis/redis.service';
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
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

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

    // Generate OTP and store in Redis
    const otp = this.generateOtp();
    await this.redisService.set(`otp:${dto.email}`, otp, 300);

    try {
      await this.emailService.sendOtp(dto.email, otp, 'verify');
    } catch (err) {
      this.logger.error(`Failed to send OTP to ${dto.email}`, err);
      throw new HttpException(
        { error: 'Failed to send verification email. Check SMTP config.', code: 'EMAIL_SEND_FAILED' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return { message: 'OTP sent to email' };
  }

  // ─── Verify OTP ───────────────────────────────────────────────────────────

  async verifyOtp(dto: VerifyOtpDto) {
    const stored = await this.redisService.get(`otp:${dto.email}`);
    if (!stored || stored !== dto.otp) {
      throw new BadRequestException({
        error: 'Invalid or expired OTP',
        code: 'INVALID_OTP',
      });
    }

    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new BadRequestException({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    user.isVerified = true;
    await this.userRepo.save(user);
    await this.redisService.del(`otp:${dto.email}`);

    const tokens = this.issueTokens(user.id, user.email);
    return { ...tokens, user: this.userResponse(user) };
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
      // Resend OTP — best-effort, don't let SMTP failure cause a 500
      const otp = this.generateOtp();
      await this.redisService.set(`otp:${user.email}`, otp, 300);
      try {
        await this.emailService.sendOtp(user.email, otp, 'verify');
      } catch (err) {
        this.logger.error(`Failed to resend OTP to ${user.email} during login`, err);
      }

      throw new ForbiddenException({
        error: 'Email not verified',
        code: 'EMAIL_NOT_VERIFIED',
        otpResent: true,
      });
    }

    const tokens = this.issueTokens(user.id, user.email);
    return { ...tokens, user: this.userResponse(user) };
  }

  // ─── Resend OTP ───────────────────────────────────────────────────────────

  async resendOtp(dto: ResendOtpDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      // Return 200 regardless — don't leak if email exists
      return { message: 'OTP sent' };
    }

    const attemptsKey = `otp_attempts:${dto.email}`;
    const currentAttempts = parseInt(
      (await this.redisService.get(attemptsKey)) ?? '0',
    );

    if (currentAttempts >= 3) {
      throw new HttpException(
        { error: 'Too many attempts. Try again later.', code: 'RATE_LIMITED' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const newCount = await this.redisService.incr(attemptsKey);
    if (newCount === 1) {
      await this.redisService.expire(attemptsKey, 600);
    }

    const otp = this.generateOtp();
    await this.redisService.set(`otp:${dto.email}`, otp, 300);
    await this.emailService.sendOtp(dto.email, otp, 'verify');

    return { message: 'OTP sent' };
  }

  // ─── Forgot Password ──────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (user) {
      const otp = this.generateOtp();
      await this.redisService.set(`reset_otp:${dto.email}`, otp, 300);
      try {
        await this.emailService.sendOtp(dto.email, otp, 'reset');
      } catch {
        this.logger.error(`Failed to send reset OTP to ${dto.email}`);
      }
    }
    // Always 200 — never reveal if email exists
    return { message: 'If that email exists, a code was sent.' };
  }

  // ─── Reset Password ───────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto) {
    const stored = await this.redisService.get(`reset_otp:${dto.email}`);
    if (!stored || stored !== dto.otp) {
      throw new BadRequestException({
        error: 'Invalid or expired code',
        code: 'INVALID_RESET_CODE',
      });
    }

    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new BadRequestException({
        error: 'Invalid or expired code',
        code: 'INVALID_RESET_CODE',
      });
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepo.save(user);
    await this.redisService.del(`reset_otp:${dto.email}`);

    return { message: 'Password reset successful' };
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
        const ttl = payload.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.redisService.set(`blacklist:${token}`, '1', ttl);
        }
      }
    } catch {
      // Ignore errors on logout
    }
    return { message: 'Logged out' };
  }
}
