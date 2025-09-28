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

function mapRarity(optcgRarity: string): string {
  const rarityMap: { [key: string]: string } = {
    'C': 'Common',
    'UC': 'Uncommon', 
    'R': 'Rare',
    'SR': 'Super Rare',
    'L': 'Leader',
    'SEC': 'Secret Rare',
    'TR': 'Treasure Rare',
    'SP': 'Special',
  };
  return rarityMap[optcgRarity] || 'Common';
}

function mapCardType(optcgType: string): string {
  return optcgType;
}

function mapColor(optcgColor: string): string {
  return optcgColor;
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
    counterPower: null,
    attribute: card.attribute || null,
    color: mapColor(card.card_color),
    effectText: card.card_text || null,
    flavorText: null,
    imageUrl: card.card_image,
    smallImageUrl: card.card_image,
    largeImageUrl: card.card_image,
    isActive: true,
  };
}

async function main() {
  console.log('🌱 Seeding ST-22 (Ace & Newgate) cards...');
  
  try {
    console.log('🔍 Fetching ST-22 cards from optcgapi.com...');
    const response = await axios.get('https://optcgapi.com/api/decks/ST-22/');
    
    if (Array.isArray(response.data)) {
      console.log(`📈 Found ${response.data.length} cards`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const cardData of response.data) {
        try {
          const mappedCard = mapOPTCGToOurSchema(cardData);
          await prisma.card.upsert({
            where: { apiId: mappedCard.apiId },
            update: mappedCard,
            create: mappedCard,
          });
          console.log(`  ✅ Seeded: ${mappedCard.name} (${mappedCard.rarity})`);
          successCount++;
        } catch (error: any) {
          console.error(`  ❌ Error seeding ${cardData.card_name}: ${error.message}`);
          errorCount++;
        }
      }
      
      console.log('\n🎉 ST-22 seeding completed!');
      console.log(`✅ Successfully seeded: ${successCount} cards`);
      console.log(`❌ Total errors: ${errorCount} cards`);
      console.log(`📊 Success rate: ${Math.round((successCount / (successCount + errorCount)) * 100)}%`);
    } else {
      console.log('❌ No cards found for ST-22');
    }
  } catch (error: any) {
    console.error(`❌ Error fetching ST-22: ${error.message}`);
  }
}

main()
  .catch((e) => {
    console.error('💥 Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
