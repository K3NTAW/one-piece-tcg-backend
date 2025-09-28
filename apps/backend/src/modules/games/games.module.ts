import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { GameEngineService } from './game-engine.service';
import { AiOpponentService } from './ai-opponent.service';
import { MatchmakingService } from './matchmaking.service';
import { GameGateway } from '../game/game.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [GamesService, GameEngineService, AiOpponentService, MatchmakingService, GameGateway],
  controllers: [GamesController],
  exports: [GamesService, GameEngineService, AiOpponentService, MatchmakingService, GameGateway],
})
export class GamesModule {}
