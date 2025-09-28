import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Common One Piece TCG effects
const commonEffects = [
  {
    effectType: 'Activate',
    effectText: 'Draw 1 card',
    conditions: 'Once per turn'
  },
  {
    effectType: 'Activate',
    effectText: 'Draw 2 cards',
    conditions: 'Once per turn'
  },
  {
    effectType: 'Activate',
    effectText: 'Search your deck for a character card',
    conditions: 'Once per turn'
  },
  {
    effectType: 'Activate',
    effectText: 'This character gets +1000 power',
    conditions: 'When this character attacks'
  },
  {
    effectType: 'Activate',
    effectText: 'This character gets +2000 power',
    conditions: 'When this character attacks'
  },
  {
    effectType: 'Trigger',
    effectText: 'Rush - This character can attack the turn it is played',
    conditions: 'When this character is played'
  },
  {
    effectType: 'Counter',
    effectText: 'Add +1000 to your counter power',
    conditions: 'When defending'
  },
  {
    effectType: 'Counter',
    effectText: 'Add +2000 to your counter power',
    conditions: 'When defending'
  },
  {
    effectType: 'Passive',
    effectText: 'Blocker - This character can block attacks',
    conditions: 'Always active'
  },
  {
    effectType: 'Activate',
    effectText: 'Heal 1 life',
    conditions: 'Once per turn'
  },
  {
    effectType: 'Activate',
    effectText: 'Deal 1 damage to opponent',
    conditions: 'Once per turn'
  },
  {
    effectType: 'Activate',
    effectText: 'Discard 1 card from your hand',
    conditions: 'Cost to activate'
  },
  {
    effectType: 'Activate',
    effectText: 'Attach 1 DON!! to this character',
    conditions: 'Once per turn'
  },
  {
    effectType: 'Activate',
    effectText: 'Detach 1 DON!! from this character',
    conditions: 'Once per turn'
  },
  {
    effectType: 'Trigger',
    effectText: 'When this character is KO\'d, draw 1 card',
    conditions: 'When this character is defeated'
  },
  {
    effectType: 'Trigger',
    effectText: 'When this character attacks, deal 1 damage to opponent',
    conditions: 'When this character attacks'
  },
  {
    effectType: 'Activate',
    effectText: 'Search your deck for a DON!! card',
    conditions: 'Once per turn'
  },
  {
    effectType: 'Activate',
    effectText: 'This character cannot be blocked',
    conditions: 'When this character attacks'
  },
  {
    effectType: 'Activate',
    effectText: 'This character cannot be countered',
    conditions: 'When this character attacks'
  },
  {
    effectType: 'Passive',
    effectText: 'This character cannot be targeted by effects',
    conditions: 'Always active'
  }
];

async function populateCardEffects() {
  console.log('Starting to populate card effects...');

  try {
    // Get all cards that don't have effects yet
    const cardsWithoutEffects = await prisma.card.findMany({
      where: {
        effects: {
          none: {}
        }
      }
      // Remove the take limit to process all cards
    });

    console.log(`Found ${cardsWithoutEffects.length} cards without effects`);

    for (const card of cardsWithoutEffects) {
      // Skip if card has no effect text
      if (!card.effectText || card.effectText.trim() === '') {
        continue;
      }

      // Determine effect type based on card type and effect text
      let effectType = 'Activate';
      let conditions = 'Once per turn';

      // Leader cards often have passive effects
      if (card.cardType === 'Leader') {
        effectType = 'Passive';
        conditions = 'Always active';
      }

      // Character cards with Rush keyword
      if (card.effectText.toLowerCase().includes('rush')) {
        effectType = 'Trigger';
        conditions = 'When this character is played';
      }

      // Counter effects
      if (card.effectText.toLowerCase().includes('counter')) {
        effectType = 'Counter';
        conditions = 'When defending';
      }

      // Blocker effects
      if (card.effectText.toLowerCase().includes('blocker')) {
        effectType = 'Passive';
        conditions = 'Always active';
      }

      // Draw effects
      if (card.effectText.toLowerCase().includes('draw')) {
        effectType = 'Activate';
        conditions = 'Once per turn';
      }

      // Search effects
      if (card.effectText.toLowerCase().includes('search')) {
        effectType = 'Activate';
        conditions = 'Once per turn';
      }

      // Power boost effects
      if (card.effectText.toLowerCase().includes('power') || card.effectText.toLowerCase().includes('+')) {
        effectType = 'Activate';
        conditions = 'When this character attacks';
      }

      // Create the effect
      await prisma.cardEffect.create({
        data: {
          cardId: card.id,
          effectType,
          effectText: card.effectText,
          conditions,
          cost: 0 // Most effects are free to activate
        }
      });

      console.log(`Added effect to card: ${card.name}`);
    }

    console.log('Finished populating card effects!');
  } catch (error) {
    console.error('Error populating card effects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateCardEffects();
