import { Module } from '@nestjs/common';
import { BattlePassService } from './battle-pass.service';
import { BattlePassController } from './battle-pass.controller';

@Module({
  providers: [BattlePassService],
  controllers: [BattlePassController],
  exports: [BattlePassService],
})
export class BattlePassModule {}
