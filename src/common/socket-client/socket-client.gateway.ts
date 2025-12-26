import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { io } from 'socket.io-client';
import {
  IAppConfig,
  ISocketConfig,
} from '../../common/config/config.interface';

@Injectable()
export class SocketClientGateway implements OnModuleInit {
  private readonly logger = new Logger(SocketClientGateway.name);
  private clientSocket: ReturnType<typeof io> | null = null;
  private readonly socketConfig: ISocketConfig;

  constructor(private readonly configService: ConfigService<IAppConfig>) {
    this.socketConfig = this.configService.getOrThrow<ISocketConfig>('socket');
  }

  onModuleInit(): void {
    const socketUrl = this.socketConfig.url;
    this.logger.log(`Attempting to connect to socket server at: ${socketUrl}`);

    this.clientSocket = io(socketUrl, {
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Обработка событий подключения
    this.clientSocket.on('connect', () => {
      this.logger.log(
        `Successfully connected to socket server at: ${socketUrl}`,
      );
    });

    this.clientSocket.on('connect_error', (error) => {
      this.logger.error(
        `Failed to connect to socket server at ${socketUrl}: ${error.message}`,
        error.stack,
      );
    });

    this.clientSocket.on('disconnect', (reason) => {
      this.logger.warn(`Disconnected from socket server: ${reason}`);
    });

    this.clientSocket.on('error', (error) => {
      this.logger.error(`Socket error: ${error.message}`, error.stack);
    });

    // Подписка на топики
    this.socketConfig.topics.forEach((topic) => {
      if (this.clientSocket) {
        this.clientSocket.on(topic, (data) => {
          this.logger.debug(`Received data on topic '${topic}':`, data);
        });
      }
    });
  }
}
