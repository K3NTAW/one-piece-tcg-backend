import { Module } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { CardDataService } from './card-data.service';
import { CardSeedService } from './card-seed.service';

@Module({
  providers: [CardsService, CardDataService, CardSeedService],
  controllers: [CardsController],
  exports: [CardsService, CardDataService, CardSeedService],
})
export class CardsModule {}
