import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface GameCard {
  id: string;
  cardId: string;
  name: string;
  cardType: string;
  cost?: number;
  power?: number;
  counterPower?: number;
  color: string;
  effectText?: string;
  isActive: boolean;
  isResting: boolean;
  position?: 'field' | 'hand' | 'deck' | 'trash';
}

export interface Player {
  id: string;
  userId: string;
  username: string;
  leader: GameCard;
  hand: GameCard[];
  deck: GameCard[];
  trash: GameCard[];
  field: GameCard[];
  life: number;
  don: number;
  maxDon: number;
  isActive: boolean;
  isWinner: boolean;
}

export interface GameState {
  id: string;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  currentPlayer: string;
  turn: number;
  phase: 'DON_PHASE' | 'MAIN_PHASE' | 'BATTLE_PHASE' | 'END_PHASE';
  players: Player[];
  winner?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameAction {
  type: 'PLAY_CARD' | 'ATTACK' | 'USE_EFFECT' | 'END_TURN' | 'CONCEDE';
  playerId: string;
  cardId?: string;
  targetId?: string;
  data?: any;
}

@Injectable()
export class GameEngineService {
  private readonly logger = new Logger(GameEngineService.name);

  constructor(private prisma: PrismaService) {}

  async createGame(player1Id: string, player2Id: string, deck1Id: string, deck2Id: string): Promise<GameState> {
    try {
      // Get player decks
      const [deck1, deck2] = await Promise.all([
        this.prisma.deck.findFirst({
          where: { id: deck1Id, userId: player1Id },
          include: { cards: { include: { card: true } } },
        }),
        this.prisma.deck.findFirst({
          where: { id: deck2Id, userId: player2Id },
          include: { cards: { include: { card: true } } },
        }),
      ]);

      if (!deck1 || !deck2) {
        throw new Error('One or both decks not found');
      }

      // Get user information
      const [user1, user2] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: player1Id } }),
        this.prisma.user.findUnique({ where: { id: player2Id } }),
      ]);

      if (!user1 || !user2) {
        throw new Error('One or both users not found');
      }

      // Create game in database
      const game = await this.prisma.game.create({
        data: {
          player1Id,
          player2Id,
          deck1Id,
          deck2Id,
          status: 'ACTIVE',
          currentPlayerId: player1Id,
          turn: 1,
          phase: 'DON_PHASE',
        },
      });

      // Initialize players
      const player1: Player = {
        id: player1Id,
        userId: player1Id,
        username: user1.username,
        leader: this.createGameCard(deck1.leaderId ? await this.getCardById(deck1.leaderId) : null),
        hand: [],
        deck: this.shuffleDeck(this.createDeckFromCards(deck1.cards)),
        trash: [],
        field: [],
        life: 4,
        don: 0,
        maxDon: 0,
        isActive: true,
        isWinner: false,
      };

      const player2: Player = {
        id: player2Id,
        userId: player2Id,
        username: user2.username,
        leader: this.createGameCard(deck2.leaderId ? await this.getCardById(deck2.leaderId) : null),
        hand: [],
        deck: this.shuffleDeck(this.createDeckFromCards(deck2.cards)),
        trash: [],
        field: [],
        life: 4,
        don: 0,
        maxDon: 0,
        isActive: true,
        isWinner: false,
      };

      // Draw initial hands
      this.drawInitialHand(player1);
      this.drawInitialHand(player2);

      const gameState: GameState = {
        id: game.id,
        status: 'ACTIVE',
        currentPlayer: player1Id,
        turn: 1,
        phase: 'DON_PHASE',
        players: [player1, player2],
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
      };

      this.logger.log(`Game ${game.id} created between ${user1.username} and ${user2.username}`);
      return gameState;
    } catch (error) {
      this.logger.error('Failed to create game:', error.message);
      throw error;
    }
  }

  async processAction(gameId: string, action: GameAction): Promise<GameState> {
    try {
      const game = await this.prisma.game.findUnique({
        where: { id: gameId },
        include: {
          player1: true,
          player2: true,
          deck1: {
            include: {
              cards: {
                include: { card: true },
              },
            },
          },
          deck2: {
            include: {
              cards: {
                include: { card: true },
              },
            },
          },
        },
      });

      if (!game) {
        throw new Error('Game not found');
      }

      if (game.status !== 'ACTIVE') {
        throw new Error('Game is not active');
      }

      if (game.currentPlayerId !== action.playerId) {
        throw new Error('Not your turn');
      }

      // Process the action based on type
      let gameState: GameState;
      switch (action.type) {
        case 'PLAY_CARD':
          gameState = await this.playCard(gameId, action);
          break;
        case 'ATTACK':
          gameState = await this.attack(gameId, action);
          break;
        case 'USE_EFFECT':
          gameState = await this.useEffect(gameId, action);
          break;
        case 'END_TURN':
          gameState = await this.endTurn(gameId, action);
          break;
        case 'CONCEDE':
          gameState = await this.concede(gameId, action);
          break;
        default:
          throw new Error('Invalid action type');
      }

      // Update game in database
      await this.updateGameInDatabase(gameId, gameState);

      return gameState;
    } catch (error) {
      this.logger.error(`Failed to process action in game ${gameId}:`, error.message);
      throw error;
    }
  }

  private async playCard(gameId: string, action: GameAction): Promise<GameState> {
    // Implementation for playing a card
    // This would handle the complex logic of playing different card types
    throw new Error('Play card not implemented yet');
  }

  private async attack(gameId: string, action: GameAction): Promise<GameState> {
    // Implementation for attacking with a character
    throw new Error('Attack not implemented yet');
  }

  private async useEffect(gameId: string, action: GameAction): Promise<GameState> {
    // Implementation for using card effects
    throw new Error('Use effect not implemented yet');
  }

  private async endTurn(gameId: string, action: GameAction): Promise<GameState> {
    // Implementation for ending turn
    throw new Error('End turn not implemented yet');
  }

  private async concede(gameId: string, action: GameAction): Promise<GameState> {
    // Implementation for conceding
    throw new Error('Concede not implemented yet');
  }

  private createGameCard(card: any): GameCard {
    if (!card) return null;
    
    return {
      id: `${card.id}-${Date.now()}`,
      cardId: card.id,
      name: card.name,
      cardType: card.cardType,
      cost: card.cost,
      power: card.power,
      counterPower: card.counterPower,
      color: card.color,
      effectText: card.effectText,
      isActive: true,
      isResting: false,
      position: 'hand',
    };
  }

  private createDeckFromCards(deckCards: any[]): GameCard[] {
    const cards: GameCard[] = [];
    
    for (const deckCard of deckCards) {
      for (let i = 0; i < deckCard.quantity; i++) {
        cards.push(this.createGameCard(deckCard.card));
      }
    }
    
    return cards;
  }

  private shuffleDeck(deck: GameCard[]): GameCard[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private drawInitialHand(player: Player): void {
    // Draw 5 cards for initial hand
    for (let i = 0; i < 5; i++) {
      if (player.deck.length > 0) {
        const card = player.deck.pop();
        card.position = 'hand';
        player.hand.push(card);
      }
    }
  }

  private async getCardById(cardId: string): Promise<any> {
    return this.prisma.card.findUnique({
      where: { id: cardId },
    });
  }

  private async updateGameInDatabase(gameId: string, gameState: GameState): Promise<void> {
    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: gameState.status,
        currentPlayerId: gameState.currentPlayer,
        turn: gameState.turn,
        phase: gameState.phase,
        winnerId: gameState.winner,
        updatedAt: new Date(),
      },
    });
  }

  // Game validation methods
  validateDeck(deck: any[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (deck.length < 50) {
      errors.push('Deck must have at least 50 cards');
    }
    
    if (deck.length > 60) {
      errors.push('Deck must have at most 60 cards');
    }
    
    // Check for leader
    const hasLeader = deck.some(card => card.card.cardType === 'Leader');
    if (!hasLeader) {
      errors.push('Deck must have exactly one leader');
    }
    
    // Check card quantities
    const cardCounts = new Map();
    for (const deckCard of deck) {
      const cardId = deckCard.card.id;
      const count = cardCounts.get(cardId) || 0;
      cardCounts.set(cardId, count + deckCard.quantity);
    }
    
    for (const [cardId, count] of cardCounts) {
      if (count > 4) {
        errors.push(`Card ${cardId} appears ${count} times (max 4)`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Game state helpers
  getCurrentPlayer(gameState: GameState): Player {
    return gameState.players.find(p => p.id === gameState.currentPlayer);
  }

  getOpponent(gameState: GameState, playerId: string): Player {
    return gameState.players.find(p => p.id !== playerId);
  }

  checkWinCondition(gameState: GameState): string | null {
    for (const player of gameState.players) {
      if (player.life <= 0) {
        return gameState.players.find(p => p.id !== player.id).id;
      }
    }
    return null;
  }
}
