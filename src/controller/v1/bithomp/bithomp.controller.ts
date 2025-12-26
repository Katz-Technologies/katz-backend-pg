import { Controller, Get, Param, Res, Header } from '@nestjs/common';
import type { Response } from 'express';
import { BithompService } from 'src/service/bithomp/bithomp.service';
import { GetAvatarDto } from './dto/get-avatar.dto';
import { GetIssuedTokenDto } from './dto/get-issued-token.dto';

@Controller('v1/bithomp')
export class BithompController {
  constructor(private readonly bithompService: BithompService) {}

  @Get('avatar/:address')
  @Header('Content-Type', 'image/png')
  async getAccountAvatar(@Param() data: GetAvatarDto, @Res() res: Response) {
    const imageBuffer = await this.bithompService.getAccountAvatar(data);
    res.send(imageBuffer);
  }

  @Get('issued-token/:issuer/:currencyHex')
  @Header('Content-Type', 'image/png')
  async getIssuedTokenAvatar(
    @Param() data: GetIssuedTokenDto,
    @Res() res: Response,
  ) {
    const imageBuffer = await this.bithompService.getIssuedTokenAvatar(data);
    res.send(imageBuffer);
  }
}
