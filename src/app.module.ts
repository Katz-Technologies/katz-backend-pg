import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CommonModule } from './common/common.module';
import { ControllersModule } from './controller/controllers.module';
import { LoggingInterceptor } from './common/logger/logging.interceptor';
import { CronModule } from './jobs/cron.module';

@Module({
  imports: [CommonModule, ControllersModule, CronModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
