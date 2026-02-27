import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>(
          'REDIS_URL',
          'redis://localhost:6379',
        );
        const isTls = url.startsWith('rediss://');
        return new Redis(
          url,
          isTls ? { tls: { rejectUnauthorized: false } } : {},
        );
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
