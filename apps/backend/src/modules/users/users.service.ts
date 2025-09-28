import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        collections: {
          include: {
            card: true,
          },
        },
        decks: {
          include: {
            cards: {
              include: {
                card: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    return this.sanitizeUser(user);
  }

  async getCollection(userId: string) {
    const collections = await this.prisma.userCollection.findMany({
      where: { userId },
      include: {
        card: true,
      },
    });

    return collections;
  }

  async addToCollection(userId: string, cardId: string, quantity: number = 1) {
    const existingCollection = await this.prisma.userCollection.findUnique({
      where: {
        userId_cardId: {
          userId,
          cardId,
        },
      },
    });

    if (existingCollection) {
      return this.prisma.userCollection.update({
        where: {
          userId_cardId: {
            userId,
            cardId,
          },
        },
        data: {
          quantity: existingCollection.quantity + quantity,
        },
        include: {
          card: true,
        },
      });
    }

    return this.prisma.userCollection.create({
      data: {
        userId,
        cardId,
        quantity,
      },
      include: {
        card: true,
      },
    });
  }

  async removeFromCollection(userId: string, cardId: string, quantity: number = 1) {
    const existingCollection = await this.prisma.userCollection.findUnique({
      where: {
        userId_cardId: {
          userId,
          cardId,
        },
      },
    });

    if (!existingCollection) {
      throw new NotFoundException('Card not found in collection');
    }

    const newQuantity = existingCollection.quantity - quantity;

    if (newQuantity <= 0) {
      return this.prisma.userCollection.delete({
        where: {
          userId_cardId: {
            userId,
            cardId,
          },
        },
      });
    }

    return this.prisma.userCollection.update({
      where: {
        userId_cardId: {
          userId,
          cardId,
        },
      },
      data: {
        quantity: newQuantity,
      },
      include: {
        card: true,
      },
    });
  }

  async getStats(userId: string) {
    // Get user's collection count
    const totalCards = await this.prisma.userCollection.aggregate({
      where: { userId },
      _sum: { quantity: true },
    });

    // Get user's deck count
    const totalDecks = await this.prisma.deck.count({
      where: { userId },
    });

    // Get user's game statistics
    const gamesPlayed = await this.prisma.game.count({
      where: {
        OR: [
          { player1Id: userId },
          { player2Id: userId },
        ],
        status: 'COMPLETED',
      },
    });

    const gamesWon = await this.prisma.game.count({
      where: {
        winnerId: userId,
        status: 'COMPLETED',
      },
    });

    const winRate = gamesPlayed > 0 ? (gamesWon / gamesPlayed) * 100 : 0;

    // Calculate level and experience (mock for now)
    const experience = gamesWon * 50 + gamesPlayed * 10;
    const level = Math.floor(experience / 100) + 1;
    const nextLevelExp = level * 100;

    // Determine rank based on level
    let rank = 'Rookie';
    if (level >= 20) rank = 'Yonko';
    else if (level >= 15) rank = 'Grand Line';
    else if (level >= 10) rank = 'Paradise';
    else if (level >= 5) rank = 'East Blue';

    return {
      totalCards: totalCards._sum.quantity || 0,
      totalDecks,
      gamesPlayed,
      gamesWon,
      winRate: Math.round(winRate * 10) / 10,
      rank,
      level,
      experience,
      nextLevelExp,
    };
  }

  sanitizeUser(user: any) {
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
