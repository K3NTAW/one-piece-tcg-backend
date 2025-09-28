import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DecksService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.deck.findMany({
      where: { userId },
      include: {
        cards: {
          include: {
            card: true,
          },
        },
      },
    });
  }

  async create(userId: string, data: any) {
    const { cards, leaderId, ...deckData } = data;
    
    return this.prisma.deck.create({
      data: {
        ...deckData,
        userId,
        leaderId,
        cards: {
          create: cards.map((cardData: any) => ({
            cardId: cardData.cardId,
            quantity: cardData.quantity,
          })),
        },
      },
      include: {
        cards: {
          include: {
            card: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.deck.findFirst({
      where: { id, userId },
      include: {
        cards: {
          include: {
            card: true,
          },
        },
      },
    });
  }

  async update(id: string, userId: string, data: any) {
    const { cards, leaderId, ...deckData } = data;
    
    // Update deck info
    const deck = await this.prisma.deck.update({
      where: { id, userId },
      data: {
        ...deckData,
        leaderId,
      },
    });

    // Update cards if provided
    if (cards) {
      // Remove existing cards
      await this.prisma.deckCard.deleteMany({
        where: { deckId: id },
      });

      // Add new cards
      await this.prisma.deckCard.createMany({
        data: cards.map((cardData: any) => ({
          deckId: id,
          cardId: cardData.cardId,
          quantity: cardData.quantity,
        })),
      });
    }

    return this.findOne(id, userId);
  }

  async delete(id: string, userId: string) {
    return this.prisma.deck.delete({
      where: { id, userId },
    });
  }
}
