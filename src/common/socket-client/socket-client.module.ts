import { Module } from '@nestjs/common';
import { SocketClientGateway } from './socket-client.gateway';

@Module({
  providers: [SocketClientGateway],
  exports: [SocketClientGateway],
})
export class SocketClientModule {}
