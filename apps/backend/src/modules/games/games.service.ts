import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.game.findMany({
      include: {
        players: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findUserGames(userId: string) {
    return this.prisma.game.findMany({
      where: {
        OR: [
          { player1Id: userId },
          { player2Id: userId },
        ],
      },
      include: {
        players: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.game.findFirst({
      where: {
        id,
        OR: [
          { player1Id: userId },
          { player2Id: userId },
        ],
      },
      include: {
        players: {
          include: {
            user: true,
          },
        },
        actions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async createGame(player1Id: string, player2Id: string, deck1Id: string, deck2Id: string) {
    return this.prisma.game.create({
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
  }

  async updateGame(id: string, data: any) {
    return this.prisma.game.update({
      where: { id },
      data,
    });
  }

  async addGameAction(gameId: string, action: any) {
    return this.prisma.gameAction.create({
      data: {
        gameId,
        ...action,
      },
    });
  }
}
