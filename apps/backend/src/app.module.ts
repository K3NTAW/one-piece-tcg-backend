import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CardsModule } from './modules/cards/cards.module';
import { DecksModule } from './modules/decks/decks.module';
import { GamesModule } from './modules/games/games.module';
import { SocialModule } from './modules/social/social.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BattlePassModule } from './modules/battle-pass/battle-pass.module';
import { FilesModule } from './modules/files/files.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    CardsModule,
    DecksModule,
    GamesModule,
    SocialModule,
    NotificationsModule,
    BattlePassModule,
    FilesModule,
    HealthModule,
  ],
})
export class AppModule {}
