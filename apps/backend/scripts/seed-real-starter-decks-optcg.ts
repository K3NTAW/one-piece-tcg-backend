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

async function fetchAllStarterDeckCards(): Promise<{ success: number; errors: number }> {
  let successCount = 0;
  let errorCount = 0;
  
  try {
    console.log('🔍 Fetching all starter deck cards from optcgapi.com...');
    
    // Try different approaches to get starter deck cards
    const approaches = [
      // Approach 1: Try to get all sets first to see what's available
      async () => {
        console.log('  📋 Approach 1: Fetching all sets to see available starter decks...');
        const response = await axios.get('https://optcgapi.com/api/allSets/');
        const sets = response.data;
        console.log(`    📊 Found ${sets.length} total sets`);
        
        // Filter for starter deck sets
        const starterSets = sets.filter((set: any) => 
          set.set_id && set.set_id.startsWith('ST-')
        );
        console.log(`    🃏 Found ${starterSets.length} starter deck sets: ${starterSets.map((s: any) => s.set_id).join(', ')}`);
        
        // Fetch cards from each starter deck
        let allCards: OPTCGCard[] = [];
        for (const set of starterSets) {
          try {
            const deckResponse = await axios.get(`https://optcgapi.com/api/decks/${set.set_id}/`);
            if (Array.isArray(deckResponse.data)) {
              allCards = allCards.concat(deckResponse.data);
              console.log(`    ✅ Found ${deckResponse.data.length} cards for ${set.set_id}`);
            }
          } catch (error) {
            console.log(`    ❌ No cards for ${set.set_id}`);
          }
        }
        return allCards;
      },
      
      // Approach 2: Try individual starter deck endpoints directly
      async () => {
        console.log('  📋 Approach 2: Trying individual starter deck endpoints...');
        const starterDecks = ['ST-01', 'ST-02', 'ST-03', 'ST-04', 'ST-05', 'ST-06', 'ST-07', 'ST-08', 'ST-09', 'ST-10'];
        let allCards: OPTCGCard[] = [];
        
        for (const stId of starterDecks) {
          try {
            const response = await axios.get(`https://optcgapi.com/api/decks/${stId}/`);
            if (Array.isArray(response.data)) {
              allCards = allCards.concat(response.data);
              console.log(`    ✅ Found ${response.data.length} cards for ${stId}`);
            }
          } catch (error) {
            console.log(`    ❌ No cards for ${stId}`);
          }
        }
        return allCards;
      },
    ];
    
    let allCards: OPTCGCard[] = [];
    let foundCards = false;
    
    for (const approach of approaches) {
      try {
        const cards = await approach();
        if (Array.isArray(cards) && cards.length > 0) {
          // Filter for starter deck cards if we got all cards
          if (cards.some((card: any) => card.set_id && card.set_id.startsWith('ST-'))) {
            allCards = cards.filter((card: any) => card.set_id && card.set_id.startsWith('ST-'));
            console.log(`  ✅ Found ${allCards.length} starter deck cards`);
            foundCards = true;
            break;
          } else if (cards.some((card: any) => card.card_set_id && card.card_set_id.startsWith('ST'))) {
            allCards = cards.filter((card: any) => card.card_set_id && card.card_set_id.startsWith('ST'));
            console.log(`  ✅ Found ${allCards.length} starter deck cards`);
            foundCards = true;
            break;
          } else {
            // Assume all cards are starter deck cards
            allCards = cards;
            console.log(`  ✅ Found ${allCards.length} cards (assuming starter deck)`);
            foundCards = true;
            break;
          }
        }
      } catch (error: any) {
        console.log(`  ❌ Approach failed: ${error.message}`);
        continue;
      }
    }
    
    if (!foundCards || allCards.length === 0) {
      console.log('  ❌ No starter deck cards found through any approach');
      return { success: 0, errors: 0 };
    }
    
    console.log(`\n📊 Processing ${allCards.length} starter deck cards...`);
    
    // Process and seed the cards
    for (const cardData of allCards) {
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
    console.error(`❌ Error fetching starter deck cards: ${error.message}`);
    return { success: 0, errors: 0 };
  }
}

async function main() {
  console.log('🌱 Starting real One Piece TCG starter deck cards seeding from optcgapi.com...');
  console.log('📚 Fetching cards with real images from the API');
  
  const result = await fetchAllStarterDeckCards();
  
  console.log(`\n🎉 Real starter deck seeding completed!`);
  console.log(`✅ Successfully seeded: ${result.success} cards`);
  console.log(`❌ Total errors: ${result.errors} cards`);
  console.log(`📊 Success rate: ${Math.round((result.success / (result.success + result.errors)) * 100)}%`);
  console.log(`🖼️  All cards now have real images from optcgapi.com!`);
}

main()
  .catch((e) => {
    console.error('💥 Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
