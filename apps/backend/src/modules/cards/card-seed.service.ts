import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CardDataService, OnePieceCard } from './card-data.service';

@Injectable()
export class CardSeedService {
  private readonly logger = new Logger(CardSeedService.name);

  constructor(
    private prisma: PrismaService,
    private cardDataService: CardDataService,
  ) {}

  async seedCardsFromAPI(page = 1, limit = 100): Promise<{ synced: number; total: number; errors: number }> {
    let synced = 0;
    let errors = 0;
    let total = 0;

    try {
      this.logger.log(`Starting card seeding from API TCG (page ${page}, limit ${limit})`);

      // Get cards from API
      const response = await this.cardDataService.getAllCards(page, limit);
      const cards = response.data;
      total = response.totalCount;

      this.logger.log(`Retrieved ${cards.length} cards from API`);

      // Process each card
      for (const apiCard of cards) {
        try {
          await this.upsertCard(apiCard);
          synced++;
        } catch (error) {
          this.logger.error(`Failed to sync card ${apiCard.id}:`, error.message);
          errors++;
        }
      }

      this.logger.log(`Card seeding completed: ${synced} synced, ${errors} errors`);
      return { synced, total, errors };
    } catch (error) {
      this.logger.error('Failed to seed cards from API:', error.message);
      throw error;
    }
  }

  async seedAllCards(): Promise<{ synced: number; total: number; errors: number }> {
    let totalSynced = 0;
    let totalErrors = 0;
    let totalCards = 0;
    let page = 1;
    const limit = 100;

    try {
      this.logger.log('Starting full card database seeding...');

      // Get total count first
      const firstResponse = await this.cardDataService.getAllCards(1, 1);
      totalCards = firstResponse.totalCount;
      const totalPages = Math.ceil(totalCards / limit);

      this.logger.log(`Total cards to sync: ${totalCards} across ${totalPages} pages`);

      // Process all pages
      for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
        this.logger.log(`Processing page ${currentPage}/${totalPages}`);
        
        const result = await this.seedCardsFromAPI(currentPage, limit);
        totalSynced += result.synced;
        totalErrors += result.errors;

        // Add a small delay to avoid rate limiting
        if (currentPage < totalPages) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      this.logger.log(`Full seeding completed: ${totalSynced} synced, ${totalErrors} errors`);
      return { synced: totalSynced, total: totalCards, errors: totalErrors };
    } catch (error) {
      this.logger.error('Failed to seed all cards:', error.message);
      throw error;
    }
  }

  private async upsertCard(apiCard: OnePieceCard): Promise<void> {
    const cardData = {
      apiId: apiCard.id,
      cardNumber: this.extractCardNumber(apiCard.id),
      name: apiCard.name,
      setCode: apiCard.set?.id || 'UNKNOWN',
      setName: apiCard.set?.name || 'Unknown Set',
      rarity: apiCard.rarity,
      cardType: apiCard.type,
      cost: apiCard.cost,
      power: apiCard.power,
      counterPower: null, // Not available in API
      attribute: apiCard.attributes?.attribute || null,
      color: apiCard.color,
      effectText: apiCard.ability || null,
      flavorText: null, // Not available in API
      imageUrl: apiCard.images?.large || null,
      smallImageUrl: apiCard.images?.small || null,
      largeImageUrl: apiCard.images?.large || null,
    };

    await this.prisma.card.upsert({
      where: { apiId: apiCard.id },
      update: cardData,
      create: cardData,
    });
  }

  private extractCardNumber(cardId: string): string | null {
    // Extract card number from API ID (e.g., "OP06-014" -> "014")
    const match = cardId.match(/-(\d+)$/);
    return match ? match[1] : null;
  }

  async getCardStats(): Promise<{
    totalCards: number;
    cardsByRarity: Record<string, number>;
    cardsByType: Record<string, number>;
    cardsBySet: Record<string, number>;
  }> {
    const totalCards = await this.prisma.card.count();

    const cardsByRarity = await this.prisma.card.groupBy({
      by: ['rarity'],
      _count: { rarity: true },
    });

    const cardsByType = await this.prisma.card.groupBy({
      by: ['cardType'],
      _count: { cardType: true },
    });

    const cardsBySet = await this.prisma.card.groupBy({
      by: ['setCode'],
      _count: { setCode: true },
    });

    return {
      totalCards,
      cardsByRarity: cardsByRarity.reduce((acc, item) => {
        acc[item.rarity] = item._count.rarity;
        return acc;
      }, {} as Record<string, number>),
      cardsByType: cardsByType.reduce((acc, item) => {
        acc[item.cardType] = item._count.cardType;
        return acc;
      }, {} as Record<string, number>),
      cardsBySet: cardsBySet.reduce((acc, item) => {
        acc[item.setCode] = item._count.setCode;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async clearAllCards(): Promise<void> {
    this.logger.log('Clearing all cards from database...');
    
    // Delete in order to respect foreign key constraints
    await this.prisma.cardEffect.deleteMany();
    await this.prisma.deckCard.deleteMany();
    await this.prisma.userCollection.deleteMany();
    await this.prisma.card.deleteMany();
    
    this.logger.log('All cards cleared from database');
  }

  async searchCardsInDatabase(
    query: string,
    page = 1,
    limit = 50,
    filters?: {
      rarity?: string;
      cardType?: string;
      color?: string;
      setCode?: string;
    }
  ) {
    const skip = (page - 1) * limit;
    
    const where: any = {
      AND: [
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { effectText: { contains: query, mode: 'insensitive' } },
          ],
        },
      ],
    };

    if (filters?.rarity) {
      where.AND.push({ rarity: filters.rarity });
    }
    if (filters?.cardType) {
      where.AND.push({ cardType: filters.cardType });
    }
    if (filters?.color) {
      where.AND.push({ color: filters.color });
    }
    if (filters?.setCode) {
      where.AND.push({ setCode: filters.setCode });
    }

    const [cards, totalCount] = await Promise.all([
      this.prisma.card.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.card.count({ where }),
    ]);

    return {
      data: cards,
      count: cards.length,
      page,
      pageSize: limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    };
  }
}
