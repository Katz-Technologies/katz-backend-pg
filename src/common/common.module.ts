import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Config } from 'src/common/config/config';
import { ExternalRedisModule } from './redis/external-redis.module';
import { InternalRedisModule } from './redis/internal-redis.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { IAppConfig, IThrottlerConfig } from './config/config.interface';
// import { SocketClientModule } from './socket-client/socket-client.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [Config],
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<IAppConfig>) => [
        {
          ttl: config.getOrThrow<IThrottlerConfig>('throttler').ttl,
          limit: config.getOrThrow<IThrottlerConfig>('throttler').limit,
        },
      ],
    }),
    ExternalRedisModule,
    InternalRedisModule,
    // SocketClientModule,
  ],
})
export class CommonModule {}
