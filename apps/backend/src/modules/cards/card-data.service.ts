import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface OnePieceCard {
  id: string;
  name: string;
  rarity: string;
  type: string;
  cost?: number;
  power?: number;
  color: string;
  ability?: string;
  images: {
    small: string;
    large: string;
  };
  set: {
    id: string;
    name: string;
  };
  attributes?: {
    [key: string]: any;
  };
}

export interface ApiTcgResponse {
  data: OnePieceCard[];
  count: number;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

@Injectable()
export class CardDataService {
  private readonly logger = new Logger(CardDataService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://apitcg.com/api/one-piece';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('APITCG_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('API TCG key not found. Card data will be limited.');
    }
  }

  private getHeaders() {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  async getAllCards(page = 1, limit = 50): Promise<ApiTcgResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/cards`, {
        headers: this.getHeaders(),
        params: {
          page,
          limit,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch all cards:', error.message);
      throw new Error('Failed to fetch cards from API TCG');
    }
  }

  async searchCards(query: string, page = 1, limit = 50): Promise<ApiTcgResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/cards`, {
        headers: this.getHeaders(),
        params: {
          name: query,
          page,
          limit,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to search cards with query "${query}":`, error.message);
      throw new Error('Failed to search cards from API TCG');
    }
  }

  async getCardById(cardId: string): Promise<OnePieceCard> {
    try {
      const response = await axios.get(`${this.baseUrl}/cards/${cardId}`, {
        headers: this.getHeaders(),
      });

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to fetch card with ID "${cardId}":`, error.message);
      throw new Error(`Card with ID "${cardId}" not found`);
    }
  }

  async getCardsByRarity(rarity: string, page = 1, limit = 50): Promise<ApiTcgResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/cards`, {
        headers: this.getHeaders(),
        params: {
          rarity,
          page,
          limit,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch cards by rarity "${rarity}":`, error.message);
      throw new Error('Failed to fetch cards by rarity from API TCG');
    }
  }

  async getCardsByType(type: string, page = 1, limit = 50): Promise<ApiTcgResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/cards`, {
        headers: this.apiKey ? this.getHeaders() : {},
        params: {
          type,
          page,
          limit,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch cards by type "${type}":`, error.message);
      throw new Error('Failed to fetch cards by type from API TCG');
    }
  }

  async getCardsByColor(color: string, page = 1, limit = 50): Promise<ApiTcgResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/cards`, {
        headers: this.getHeaders(),
        params: {
          color,
          page,
          limit,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch cards by color "${color}":`, error.message);
      throw new Error('Failed to fetch cards by color from API TCG');
    }
  }

  async getCardsBySet(setId: string, page = 1, limit = 50): Promise<ApiTcgResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/cards`, {
        headers: this.getHeaders(),
        params: {
          set: setId,
          page,
          limit,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch cards by set "${setId}":`, error.message);
      throw new Error('Failed to fetch cards by set from API TCG');
    }
  }

  async getAvailableSets(): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await axios.get(`${this.baseUrl}/sets`, {
        headers: this.getHeaders(),
      });

      return response.data.data || [];
    } catch (error) {
      this.logger.error('Failed to fetch available sets:', error.message);
      throw new Error('Failed to fetch sets from API TCG');
    }
  }

  async getRarities(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/rarities`, {
        headers: this.getHeaders(),
      });

      return response.data.data || [];
    } catch (error) {
      this.logger.error('Failed to fetch rarities:', error.message);
      throw new Error('Failed to fetch rarities from API TCG');
    }
  }

  async getCardTypes(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/types`, {
        headers: this.getHeaders(),
      });

      return response.data.data || [];
    } catch (error) {
      this.logger.error('Failed to fetch card types:', error.message);
      throw new Error('Failed to fetch card types from API TCG');
    }
  }

  async getColors(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/colors`, {
        headers: this.getHeaders(),
      });

      return response.data.data || [];
    } catch (error) {
      this.logger.error('Failed to fetch colors:', error.message);
      throw new Error('Failed to fetch colors from API TCG');
    }
  }

  // Helper method to sync cards to our database
  async syncCardsToDatabase(page = 1, limit = 100): Promise<{ synced: number; total: number }> {
    try {
      const response = await this.getAllCards(page, limit);
      const cards = response.data;

      // Here you would implement the logic to save cards to your database
      // For now, we'll just log the count
      this.logger.log(`Retrieved ${cards.length} cards from API TCG (page ${page})`);
      
      // TODO: Implement database sync logic
      // await this.prisma.card.createMany({ data: cards });

      return {
        synced: cards.length,
        total: response.totalCount,
      };
    } catch (error) {
      this.logger.error('Failed to sync cards to database:', error.message);
      throw new Error('Failed to sync cards to database');
    }
  }
}
