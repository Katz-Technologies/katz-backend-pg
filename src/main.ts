import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer, ValidationError } from 'class-validator';
import { loggerOptions } from './common/logger/winston.logger';
import { ValidateException } from './common/exception/validate.exception';
import { GlobalExceptionFilter } from './common/exception/filters/global-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { IAppConfig } from './common/config/config.interface';
import { ConfigService } from '@nestjs/config';
import { LoggingInterceptor } from './common/logger/logging.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    // bufferLogs: true,
  });

  const appConfig: ConfigService<IAppConfig> = app.get(ConfigService);

  const env = appConfig.getOrThrow<string>('nodeEnv');
  const port = appConfig.getOrThrow<number>('port');

  app.setGlobalPrefix('api');

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      exceptionFactory(validationErrors: ValidationError[]): ValidateException {
        return new ValidateException(validationErrors);
      },
    }),
  );
  app.useLogger(WinstonModule.createLogger(loggerOptions(env)));

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Task Processing System')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('doc', app, document);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  await app.listen(port);
}
bootstrap();
