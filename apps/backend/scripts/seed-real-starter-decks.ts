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
    counterPower: null, // Not available in OPTCG API
    attribute: card.attribute || null,
    color: mapColor(card.card_color),
    effectText: card.card_text || null,
    flavorText: null, // Not available in OPTCG API
    imageUrl: card.card_image,
    smallImageUrl: card.card_image, // Use same image for now
    largeImageUrl: card.card_image, // Use same image for now
    isActive: true,
  };
}

async function fetchStarterDeckCards(setId: string): Promise<{ success: number; errors: number }> {
  let successCount = 0;
  let errorCount = 0;
  
  try {
    console.log(`🔍 Fetching starter deck cards for ${setId}...`);
    
    // Try different API endpoints for starter decks
    const endpoints = [
      `https://optcgapi.com/api/sets/${setId}/`,
      `https://optcgapi.com/api/sets/${setId}`,
      `https://optcgapi.com/api/cards?set=${setId}`,
    ];
    
    let cards: OPTCGCard[] = [];
    let foundData = false;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`  Trying: ${endpoint}`);
        const response = await axios.get(endpoint);
        
        if (Array.isArray(response.data)) {
          cards = response.data;
        } else if (response.data.cards && Array.isArray(response.data.cards)) {
          cards = response.data.cards;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          cards = response.data.data;
        }
        
        if (cards.length > 0) {
          console.log(`  ✅ Found ${cards.length} cards from ${endpoint}`);
          foundData = true;
          break;
        }
      } catch (error: any) {
        console.log(`  ❌ Failed: ${error.message}`);
        continue;
      }
    }
    
    if (!foundData) {
      console.log(`  ⚠️  No data found for ${setId}, trying individual card approach...`);
      
      // Try to fetch individual cards for common starter deck patterns
      const commonCardNumbers = ['001', '002', '003', '004', '005', '006', '007', '008', '009', '010'];
      
      for (const cardNumber of commonCardNumbers) {
        const cardId = `${setId}-${cardNumber}`;
        try {
          const response = await axios.get(`https://optcgapi.com/api/cards/${cardId}`);
          if (response.data && response.data.card_name) {
            cards.push(response.data);
            console.log(`  ✅ Found individual card: ${response.data.card_name}`);
          }
        } catch (error) {
          // Card not found, continue
        }
      }
    }
    
    if (cards.length === 0) {
      console.log(`  ⚠️  No cards found for ${setId}`);
      return { success: 0, errors: 0 };
    }
    
    // Process and seed the cards
    for (const cardData of cards) {
      try {
        const mappedCard = mapOPTCGToOurSchema(cardData);
        await prisma.card.upsert({
          where: { apiId: mappedCard.apiId },
          update: mappedCard,
          create: mappedCard,
        });
        console.log(`  ✅ Seeded: ${mappedCard.name} (${mappedCard.rarity}) from ${mappedCard.setCode}`);
        successCount++;
      } catch (error: any) {
        console.error(`  ❌ Error seeding ${cardData.card_name}: ${error.message}`);
        errorCount++;
      }
    }
    
    return { success: successCount, errors: errorCount };
  } catch (error: any) {
    console.error(`❌ Error fetching cards for set ${setId}: ${error.message}`);
    return { success: 0, errors: 0 };
  }
}

async function main() {
  console.log('🌱 Starting real One Piece TCG starter deck cards seeding...');
  console.log('📚 Fetching cards with real images from OPTCG API');
  
  // All starter deck sets
  const starterDecks = [
    'ST-01', 'ST-02', 'ST-03', 'ST-04', 'ST-05', 'ST-06', 'ST-07', 'ST-08',
    'ST-09', 'ST-10', 'ST-11', 'ST-12', 'ST-13', 'ST-14', 'ST-15', 'ST-16',
    'ST-17', 'ST-18', 'ST-19', 'ST-20', 'ST-21', 'ST-22', 'ST-23', 'ST-24',
    'ST-25', 'ST-26', 'ST-27', 'ST-28'
  ];
  
  let totalSuccess = 0;
  let totalErrors = 0;
  const setResults: { [key: string]: { success: number; errors: number } } = {};
  
  // Fetch cards for each starter deck
  for (const setId of starterDecks) {
    console.log(`\n🎯 Processing ${setId}...`);
    const result = await fetchStarterDeckCards(setId);
    setResults[setId] = result;
    totalSuccess += result.success;
    totalErrors += result.errors;
    
    // Add a small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 Real starter deck seeding completed!');
  console.log('\n📊 Results by set:');
  for (const [setId, result] of Object.entries(setResults)) {
    if (result.success > 0) {
      console.log(`  ${setId}: ${result.success} cards ✅, ${result.errors} errors ❌`);
    }
  }
  
  console.log(`\n📈 Total Results:`);
  console.log(`✅ Successfully seeded: ${totalSuccess} cards`);
  console.log(`❌ Total errors: ${totalErrors} cards`);
  console.log(`📚 Sets processed: ${starterDecks.length} starter decks`);
  console.log(`🖼️  All cards now have real images from OPTCG API!`);
}

main()
  .catch((e) => {
    console.error('💥 Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
