import { Module } from '@nestjs/common';
import { GeckoTerminalControllerModule } from './v1/gecko-terminal/gecko-terminal-controller.module';
// import { SmartMoneyControllerModule } from './v1/smart-money/smart-money-controller.module';
import { SologenicControllerModule } from './v1/sologenic/sologenic-controller.module';
import { XrpScanControllerModule } from './v1/xrp-scan/xrp-scan-controller.module';
import { XrplMetaControllerModule } from './v1/xrpl-meta/xrpl-meta-controller.module';
import { CoingeckoControllerModule } from './v1/coingecko/coingecko-controller.module';
import { BithompControllerModule } from './v1/bithomp/bithomp-controller.module';
import { TopTokensControllerModule } from './v1/top-tokens/top-tokens-controller.module';
// import { HealthModule } from './health/health.module';

@Module({
  imports: [
    GeckoTerminalControllerModule,
    // SmartMoneyControllerModule,
    // HealthModule,
    SologenicControllerModule,
    XrpScanControllerModule,
    XrplMetaControllerModule,
    CoingeckoControllerModule,
    BithompControllerModule,
    TopTokensControllerModule,
  ],
})
export class ControllersModule {}
