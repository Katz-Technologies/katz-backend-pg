import { Controller, Get, Query } from '@nestjs/common';
import { CoingeckoService } from 'src/service/coingecko/coingecko.service';
import { GetPriceDto } from './dto/get-price.dto';

@Controller('v1/coingecko')
export class CoingeckoController {
  constructor(private readonly coingeckoService: CoingeckoService) {}

  @Get('price')
  async getPrice(@Query() data: GetPriceDto) {
    return this.coingeckoService.getPrice(data);
  }
}
