import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CardsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    page = 1, 
    limit = 50, 
    search?: string, 
    rarity?: string, 
    type?: string, 
    color?: string, 
    set?: string
  ) {
    const skip = (page - 1) * limit;
    
    // Build where clause with filters
    const where: any = { isActive: true };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { effectText: { contains: search, mode: 'insensitive' as const } },
        { attribute: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    
    if (rarity) {
      where.rarity = rarity;
    }
    
    if (type) {
      where.cardType = type;
    }
    
    if (color) {
      where.color = color;
    }
    
    if (set) {
      where.setName = { contains: set, mode: 'insensitive' as const };
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

  async findOne(id: string) {
    return this.prisma.card.findUnique({
      where: { id },
      include: {
        effects: true,
      },
    });
  }

  async search(query: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    
    const where = {
      AND: [
        { isActive: true },
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { effectText: { contains: query, mode: 'insensitive' as const } },
            { attribute: { contains: query, mode: 'insensitive' as const } },
          ],
        },
      ],
    };

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
