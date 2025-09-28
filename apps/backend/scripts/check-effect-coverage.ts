import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEffectCoverage() {
  console.log('Checking card effect coverage...\n');

  try {
    // Get total cards
    const totalCards = await prisma.card.count();
    console.log(`Total cards in database: ${totalCards}`);

    // Get cards with effects
    const cardsWithEffects = await prisma.card.count({
      where: {
        effects: {
          some: {}
        }
      }
    });
    console.log(`Cards with effects: ${cardsWithEffects}`);

    // Get cards without effects
    const cardsWithoutEffects = await prisma.card.count({
      where: {
        effects: {
          none: {}
        }
      }
    });
    console.log(`Cards without effects: ${cardsWithoutEffects}`);

    // Get cards with effect text but no effects
    const cardsWithEffectTextButNoEffects = await prisma.card.count({
      where: {
        effectText: {
          not: null
        },
        effects: {
          none: {}
        }
      }
    });
    console.log(`Cards with effect text but no effects: ${cardsWithEffectTextButNoEffects}`);

    // Get cards without effect text
    const cardsWithoutEffectText = await prisma.card.count({
      where: {
        OR: [
          { effectText: null },
          { effectText: '' }
        ]
      }
    });
    console.log(`Cards without effect text: ${cardsWithoutEffectText}`);

    // Calculate coverage percentage
    const coveragePercentage = ((cardsWithEffects / totalCards) * 100).toFixed(2);
    console.log(`\nEffect coverage: ${coveragePercentage}%`);

    // Show some examples of cards without effects
    console.log('\n--- Sample cards without effects ---');
    const sampleCardsWithoutEffects = await prisma.card.findMany({
      where: {
        effects: {
          none: {}
        }
      },
      select: {
        name: true,
        effectText: true,
        cardType: true
      },
      take: 10
    });

    sampleCardsWithoutEffects.forEach(card => {
      console.log(`- ${card.name} (${card.cardType})`);
      if (card.effectText) {
        console.log(`  Effect text: "${card.effectText}"`);
      } else {
        console.log(`  No effect text`);
      }
    });

    // Show some examples of cards with effects
    console.log('\n--- Sample cards with effects ---');
    const sampleCardsWithEffects = await prisma.card.findMany({
      where: {
        effects: {
          some: {}
        }
      },
      select: {
        name: true,
        effectText: true,
        cardType: true,
        effects: {
          select: {
            effectType: true,
            effectText: true,
            conditions: true
          }
        }
      },
      take: 5
    });

    sampleCardsWithEffects.forEach(card => {
      console.log(`- ${card.name} (${card.cardType})`);
      console.log(`  Original effect text: "${card.effectText}"`);
      card.effects.forEach((effect, index) => {
        console.log(`  Effect ${index + 1}: [${effect.effectType}] ${effect.effectText}`);
        if (effect.conditions) {
          console.log(`    Conditions: ${effect.conditions}`);
        }
      });
      console.log('');
    });

  } catch (error) {
    console.error('Error checking effect coverage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEffectCoverage();
