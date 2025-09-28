import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GamesService } from './games.service';

interface QueuedPlayer {
  userId: string;
  username: string;
  deckId: string;
  socketId: string;
  joinedAt: Date;
  rating?: number;
}

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);
  private readonly matchmakingQueue: QueuedPlayer[] = [];
  private readonly matchmakingInterval = 5000; // Check for matches every 5 seconds
  private intervalId: NodeJS.Timeout;

  private gameGateway: any; // Will be set by the gateway

  constructor(
    private readonly prisma: PrismaService,
    private readonly gamesService: GamesService,
  ) {
    // Start matchmaking process
    this.startMatchmaking();
  }

  setGameGateway(gameGateway: any) {
    this.gameGateway = gameGateway;
  }

  async addToQueue(userId: string, username: string, deckId: string, socketId: string): Promise<void> {
    // Check if user is already in queue
    const existingIndex = this.matchmakingQueue.findIndex(player => player.userId === userId);
    if (existingIndex !== -1) {
      this.matchmakingQueue[existingIndex] = {
        userId,
        username,
        deckId,
        socketId,
        joinedAt: new Date(),
      };
      this.logger.log(`Updated queue position for user ${username}`);
      return;
    }

    // Add to queue
    this.matchmakingQueue.push({
      userId,
      username,
      deckId,
      socketId,
      joinedAt: new Date(),
    });

    this.logger.log(`User ${username} added to matchmaking queue (${this.matchmakingQueue.length} players in queue)`);
  }

  async removeFromQueue(userId: string): Promise<void> {
    const index = this.matchmakingQueue.findIndex(player => player.userId === userId);
    if (index !== -1) {
      const player = this.matchmakingQueue.splice(index, 1)[0];
      this.logger.log(`User ${player.username} removed from matchmaking queue`);
    }
  }

  async getQueueStatus(userId: string): Promise<{ position: number; totalPlayers: number; estimatedWaitTime: number }> {
    const position = this.matchmakingQueue.findIndex(player => player.userId === userId);
    const totalPlayers = this.matchmakingQueue.length;
    const estimatedWaitTime = this.calculateEstimatedWaitTime(position, totalPlayers);

    return {
      position: position === -1 ? 0 : position + 1,
      totalPlayers,
      estimatedWaitTime,
    };
  }

  private startMatchmaking(): void {
    this.intervalId = setInterval(async () => {
      await this.processMatchmaking();
    }, this.matchmakingInterval);
  }

  private async processMatchmaking(): Promise<any> {
    this.logger.log(`Processing matchmaking - Queue length: ${this.matchmakingQueue.length}`);
    
    if (this.matchmakingQueue.length < 2) {
      this.logger.log(`Not enough players in queue: ${this.matchmakingQueue.length}`);
      return;
    }

    // Simple matchmaking: pair first two players
    // In a real system, you'd consider rating, region, etc.
    const player1 = this.matchmakingQueue.shift();
    const player2 = this.matchmakingQueue.shift();

    this.logger.log(`Attempting to match: ${player1.username} vs ${player2.username}`);

    if (!player1 || !player2) {
      this.logger.error('One or both players are null');
      return;
    }

    try {
      // Create game
      this.logger.log(`Creating game for ${player1.username} vs ${player2.username}`);
      const game = await this.gamesService.create({
        player1Id: player1.userId,
        player2Id: player2.userId,
        deck1Id: player1.deckId,
        deck2Id: player2.deckId,
        roomName: `Match: ${player1.username} vs ${player2.username}`,
      });

      this.logger.log(`Match created successfully: ${player1.username} vs ${player2.username} (Game ID: ${game.id})`);

      // Notify players about match found via WebSocket gateway
      if (this.gameGateway) {
        this.logger.log(`Notifying players via WebSocket gateway`);
        await this.gameGateway.handleMatchFound(game, player1, player2);
        this.logger.log(`WebSocket notification sent`);
      } else {
        this.logger.error('GameGateway is not available');
      }
      
      return { game, player1, player2 };
    } catch (error) {
      this.logger.error(`Failed to create match: ${error.message}`);
      this.logger.error(`Error details:`, error);
      
      // Put players back in queue
      this.matchmakingQueue.unshift(player2);
      this.matchmakingQueue.unshift(player1);
    }
  }

  private calculateEstimatedWaitTime(position: number, totalPlayers: number): number {
    if (position === -1 || totalPlayers < 2) {
      return 0;
    }

    // Simple estimation: assume 2 players per match, 5-second intervals
    const matchesNeeded = Math.ceil((position + 1) / 2);
    return matchesNeeded * (this.matchmakingInterval / 1000);
  }

  getQueueLength(): number {
    return this.matchmakingQueue.length;
  }

  getQueuePlayers(): QueuedPlayer[] {
    return [...this.matchmakingQueue];
  }

  onModuleDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
