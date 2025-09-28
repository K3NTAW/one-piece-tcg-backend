import { Controller, Get, Param, Query, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';

import { CardsService } from './cards.service';
import { CardDataService } from './card-data.service';
import { CardSeedService } from './card-seed.service';

@ApiTags('cards')
@Controller('cards')
export class CardsController {
  constructor(
    private readonly cardsService: CardsService,
    private readonly cardDataService: CardDataService,
    private readonly cardSeedService: CardSeedService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all cards from API TCG' })
  @ApiResponse({ status: 200, description: 'Cards retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'rarity', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'color', required: false, type: String })
  @ApiQuery({ name: 'set', required: false, type: String })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('rarity') rarity?: string,
    @Query('type') type?: string,
    @Query('color') color?: string,
    @Query('set') set?: string,
  ) {
    const pageNum = page || 1;
    const limitNum = limit || 50;

    try {
      // Always try local database first
      const dbCards = await this.cardsService.findAll(pageNum, limitNum, search, rarity, type, color, set);
      if (dbCards.data.length > 0) {
        return dbCards;
      }

      // If no local data, fetch from API and format response
      let apiResponse;
      if (search) {
        apiResponse = await this.cardDataService.searchCards(search, pageNum, limitNum);
      } else if (rarity) {
        apiResponse = await this.cardDataService.getCardsByRarity(rarity, pageNum, limitNum);
      } else if (type) {
        apiResponse = await this.cardDataService.getCardsByType(type, pageNum, limitNum);
      } else if (color) {
        apiResponse = await this.cardDataService.getCardsByColor(color, pageNum, limitNum);
      } else if (set) {
        apiResponse = await this.cardDataService.getCardsBySet(set, pageNum, limitNum);
      } else {
        apiResponse = await this.cardDataService.getAllCards(pageNum, limitNum);
      }

      // Format API response to match expected structure
      return {
        data: apiResponse.data || [],
        count: apiResponse.data?.length || 0,
        page: pageNum,
        pageSize: limitNum,
        totalCount: apiResponse.totalCount || 0,
        totalPages: Math.ceil((apiResponse.totalCount || 0) / limitNum),
      };
    } catch (error) {
      // Fallback to local database if API fails
      return this.cardsService.findAll(pageNum, limitNum);
    }
  }

  @Get('search')
  @ApiOperation({ summary: 'Search cards by name' })
  @ApiResponse({ status: 200, description: 'Cards retrieved successfully' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchCards(
    @Query('q') query: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNum = page || 1;
    const limitNum = limit || 50;

    try {
      return await this.cardDataService.searchCards(query, pageNum, limitNum);
    } catch (error) {
      // Fallback to local database search
      return this.cardsService.search(query);
    }
  }

  @Get('filters')
  @ApiOperation({ summary: 'Get available filters (rarities, types, colors, sets)' })
  @ApiResponse({ status: 200, description: 'Filters retrieved successfully' })
  async getFilters() {
    try {
      // Try to get filters from local database first
      const [rarities, types, colors, sets] = await Promise.all([
        this.prisma.card.findMany({
          select: { rarity: true },
          distinct: ['rarity'],
          where: { isActive: true },
        }).then(results => results.map(r => r.rarity)),
        
        this.prisma.card.findMany({
          select: { cardType: true },
          distinct: ['cardType'],
          where: { isActive: true },
        }).then(results => results.map(r => r.cardType)),
        
        this.prisma.card.findMany({
          select: { color: true },
          distinct: ['color'],
          where: { isActive: true },
        }).then(results => results.map(r => r.color)),
        
        this.prisma.card.findMany({
          select: { setName: true },
          distinct: ['setName'],
          where: { isActive: true },
        }).then(results => results.map(r => r.setName)),
      ]);

      return {
        rarities: rarities.length > 0 ? rarities : ['Common', 'Uncommon', 'Rare', 'Super Rare', 'Secret Rare'],
        types: types.length > 0 ? types : ['Character', 'Event', 'Stage', 'Leader'],
        colors: colors.length > 0 ? colors : ['Red', 'Blue', 'Green', 'Purple', 'Yellow', 'Black'],
        sets: sets.length > 0 ? sets : ['Romance Dawn'],
      };
    } catch (error) {
      // Return default filters if database query fails
      return {
        rarities: ['Common', 'Uncommon', 'Rare', 'Super Rare', 'Secret Rare'],
        types: ['Character', 'Event', 'Stage', 'Leader'],
        colors: ['Red', 'Blue', 'Green', 'Purple', 'Yellow', 'Black'],
        sets: ['Romance Dawn'],
      };
    }
  }

  @Get('sync/database')
  @ApiOperation({ summary: 'Sync cards from API TCG to local database' })
  @ApiResponse({ status: 200, description: 'Cards synced successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async syncToDatabase(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNum = page || 1;
    const limitNum = limit || 100;

    return await this.cardSeedService.seedCardsFromAPI(pageNum, limitNum);
  }

  @Post('seed/all')
  @ApiOperation({ summary: 'Seed all cards from API TCG to local database' })
  @ApiResponse({ status: 200, description: 'All cards seeded successfully' })
  async seedAllCards() {
    return await this.cardSeedService.seedAllCards();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get card database statistics' })
  @ApiResponse({ status: 200, description: 'Card statistics retrieved successfully' })
  async getCardStats() {
    return await this.cardSeedService.getCardStats();
  }

  @Post('clear')
  @ApiOperation({ summary: 'Clear all cards from local database' })
  @ApiResponse({ status: 200, description: 'All cards cleared successfully' })
  async clearAllCards() {
    await this.cardSeedService.clearAllCards();
    return { message: 'All cards cleared from database' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get card by ID from API TCG' })
  @ApiResponse({ status: 200, description: 'Card retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.cardDataService.getCardById(id);
    } catch (error) {
      // Fallback to local database
      return this.cardsService.findOne(id);
    }
  }
}
