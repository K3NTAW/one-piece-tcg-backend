import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface OPTCGCard {
  card_name: string;
  set_name: string;
  set_id: string;
  rarity: string;
  card_set_id: string;
  card_color: string;
  card_type: string;
  card_cost: string | null;
  card_power: string | null;
  card_text: string | null;
  sub_types: string | null;
  attribute: string | null;
  card_image: string;
  inventory_price: number;
  market_price: number;
}

async function fetchOPTCGCards(setId: string): Promise<OPTCGCard[]> {
  try {
    console.log(`🔍 Fetching cards from OPTCG API for set ${setId}...`);
    const response = await axios.get(`https://optcgapi.com/api/sets/${setId}/`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching cards for set ${setId}:`, error.message);
    return [];
  }
}

function mapOPTCGToOurSchema(card: OPTCGCard) {
  return {
    apiId: card.card_set_id,
    cardNumber: card.card_set_id.split('-')[1] || null,
    name: card.card_name,
    setCode: card.set_id,
    setName: card.set_name,
    rarity: mapRarity(card.rarity),
    cardType: mapCardType(card.card_type),
    cost: card.card_cost ? parseInt(card.card_cost) : null,
    power: card.card_power ? parseInt(card.card_power) : null,
    counterPower: null, // Not available in OPTCG API
    attribute: card.attribute || null,
    color: mapColor(card.card_color),
    effectText: card.card_text || null,
    flavorText: null, // Not available in OPTCG API
    imageUrl: card.card_image,
    smallImageUrl: card.card_image, // Use same image for now
    largeImageUrl: card.card_image, // Use same image for now
  };
}

function mapRarity(optcgRarity: string): string {
  const rarityMap: { [key: string]: string } = {
    'C': 'Common',
    'UC': 'Uncommon', 
    'R': 'Rare',
    'SR': 'Super Rare',
    'L': 'Leader',
    'SEC': 'Secret Rare',
  };
  return rarityMap[optcgRarity] || 'Common';
}

function mapCardType(optcgType: string): string {
  const typeMap: { [key: string]: string } = {
    'Character': 'Character',
    'Leader': 'Leader',
    'Event': 'Event',
    'Stage': 'Stage',
  };
  return typeMap[optcgType] || 'Character';
}

function mapColor(optcgColor: string): string {
  // Handle multi-color cards (e.g., "Blue Purple")
  const colors = optcgColor.split(' ').map(c => c.trim());
  return colors[0] || 'Red'; // Use first color as primary
}

async function main() {
  console.log('🌱 Starting real One Piece TCG card database seeding...');

  try {
    // Fetch cards from OP-01 (Romance Dawn) set
    const cards = await fetchOPTCGCards('OP-01');
    
    if (cards.length === 0) {
      console.log('❌ No cards fetched from API');
      return;
    }

    console.log(`📦 Fetched ${cards.length} cards from OPTCG API`);

    // Clear existing cards
    console.log('🗑️ Clearing existing cards...');
    await prisma.card.deleteMany({});

    // Process and insert cards
    let successCount = 0;
    let errorCount = 0;

    for (const card of cards) {
      try {
        const mappedCard = mapOPTCGToOurSchema(card);
        
        await prisma.card.create({
          data: mappedCard,
        });
        
        console.log(`✅ Seeded card: ${mappedCard.name} (${mappedCard.rarity})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error seeding card ${card.card_name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`🎉 Card seeding completed!`);
    console.log(`✅ Successfully seeded: ${successCount} cards`);
    console.log(`❌ Errors: ${errorCount} cards`);

  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
