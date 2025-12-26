import { utilities } from 'nest-winston';
import * as winston from 'winston';

export const loggerOptions = (nodeEnv: string): winston.LoggerOptions => {
  return {
    level: nodeEnv === 'production' ? 'info' : 'debug',
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.ms(),
          nodeEnv === 'production'
            ? winston.format.json()
            : utilities.format.nestLike(undefined, {
                colors: true,
                prettyPrint: true,
              }),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ],
  };
};
