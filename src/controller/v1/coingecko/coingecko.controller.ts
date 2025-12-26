import { Controller, Get, Query } from '@nestjs/common';
import { CoingeckoService } from 'src/integrations/coingecko/coingecko.service';
import { GetPriceDto } from './dto/get-price.dto';
import { IPriceResponse } from 'src/integrations/coingecko/interface/price-response.interface';

@Controller('v1/coingecko')
export class CoingeckoController {
  constructor(private readonly coingeckoService: CoingeckoService) {}

  @Get('price')
  async getPrice(@Query() data: GetPriceDto): Promise<IPriceResponse> {
    return this.coingeckoService.getPrice(data);
  }
}
