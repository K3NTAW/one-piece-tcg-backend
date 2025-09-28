import { Module } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { GameEngineService } from './game-engine.service';
import { AiOpponentService } from './ai-opponent.service';

@Module({
  providers: [GamesService, GameEngineService, AiOpponentService],
  controllers: [GamesController],
  exports: [GamesService, GameEngineService, AiOpponentService],
})
export class GamesModule {}
