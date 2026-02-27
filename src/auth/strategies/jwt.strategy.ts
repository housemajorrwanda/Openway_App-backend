import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { RedisService } from '../../common/redis/redis.service';
import { Request } from 'express';

const strategyOptions: StrategyOptionsWithRequest = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  ignoreExpiration: false,
  secretOrKey: '', // overridden in constructor
  passReqToCallback: true,
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly redisService: RedisService,
  ) {
    super({
      ...strategyOptions,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'fallback',
    } as StrategyOptionsWithRequest);
  }

  async validate(req: Request, payload: JwtPayload): Promise<JwtPayload> {
    const authHeader = req.headers['authorization'] as string;
    const token = authHeader?.split(' ')[1];
    if (token) {
      const isBlacklisted = await this.redisService.exists(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new UnauthorizedException({
          error: 'Token has been revoked',
          code: 'TOKEN_REVOKED',
        });
      }
    }

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }
    return payload;
  }
}
