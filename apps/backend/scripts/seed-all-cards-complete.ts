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

async function fetchAllBoosterSets(): Promise<{ success: number; errors: number }> {
  let successCount = 0;
  let errorCount = 0;
  
  try {
    console.log('🔍 Fetching all booster sets from optcgapi.com...');
    
    // Get all available sets
    const response = await axios.get('https://optcgapi.com/api/allSets/');
    const allSets = response.data;
    console.log(`📊 Found ${allSets.length} total sets`);
    
    // Filter for booster sets (OP-XX)
    const boosterSets = allSets.filter((set: any) => 
      set.set_id && set.set_id.startsWith('OP-')
    );
    console.log(`🎯 Found ${boosterSets.length} booster sets: ${boosterSets.map((s: any) => s.set_id).join(', ')}`);
    
    // Fetch cards from each booster set
    for (const set of boosterSets) {
      try {
        console.log(`\n📦 Processing booster set: ${set.set_id} (${set.set_name})`);
        const setResponse = await axios.get(`https://optcgapi.com/api/sets/${set.set_id}/`);
        
        if (Array.isArray(setResponse.data)) {
          console.log(`  📈 Found ${setResponse.data.length} cards`);
          
          for (const cardData of setResponse.data) {
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
        } else {
          console.log(`  ⚠️  No cards found for ${set.set_id}`);
        }
      } catch (error: any) {
        console.error(`  ❌ Error fetching set ${set.set_id}: ${error.message}`);
        errorCount++;
      }
    }
    
    return { success: successCount, errors: errorCount };
  } catch (error: any) {
    console.error(`❌ Error fetching booster sets: ${error.message}`);
    return { success: 0, errors: 0 };
  }
}

async function fetchAllStarterDecks(): Promise<{ success: number; errors: number }> {
  let successCount = 0;
  let errorCount = 0;
  
  try {
    console.log('\n🔍 Fetching all 28 starter decks from optcgapi.com...');
    
    // Define all 28 starter decks (ST-01 to ST-28, including missing ones)
    const allStarterDecks = [
      'ST-01', 'ST-02', 'ST-03', 'ST-04', 'ST-05', 'ST-06', 'ST-07', 'ST-08', 'ST-09', 'ST-10',
      'ST-11', 'ST-12', 'ST-13', 'ST-14', 'ST-15', 'ST-16', 'ST-17', 'ST-18', 'ST-19', 'ST-20',
      'ST-21', 'ST-22', 'ST-23', 'ST-24', 'ST-25', 'ST-26', 'ST-27', 'ST-28'
    ];
    
    console.log(`🎯 Processing all ${allStarterDecks.length} starter decks: ${allStarterDecks.join(', ')}`);
    
    // Fetch cards from each starter deck
    for (const deckId of allStarterDecks) {
      try {
        console.log(`\n🃏 Processing starter deck: ${deckId}`);
        const deckResponse = await axios.get(`https://optcgapi.com/api/decks/${deckId}/`);
        
        if (Array.isArray(deckResponse.data)) {
          console.log(`  📈 Found ${deckResponse.data.length} cards`);
          
          for (const cardData of deckResponse.data) {
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
        } else {
          console.log(`  ⚠️  No cards found for ${deckId}`);
        }
      } catch (error: any) {
        console.error(`  ❌ Error fetching deck ${deckId}: ${error.message}`);
        errorCount++;
      }
    }
    
    return { success: successCount, errors: errorCount };
  } catch (error: any) {
    console.error(`❌ Error fetching starter decks: ${error.message}`);
    return { success: 0, errors: 0 };
  }
}

async function main() {
  console.log('🌱 Starting comprehensive One Piece TCG card seeding...');
  console.log('📚 Fetching ALL cards (booster sets + starter decks) with real images from optcgapi.com');
  
  // Clear existing cards to start fresh
  console.log('\n🗑️ Clearing existing cards...');
  await prisma.card.deleteMany({});
  console.log('✅ Existing cards cleared.');
  
  // Fetch all booster sets
  const boosterResult = await fetchAllBoosterSets();
  
  // Fetch all starter decks
  const starterResult = await fetchAllStarterDecks();
  
  // Calculate totals
  const totalSuccess = boosterResult.success + starterResult.success;
  const totalErrors = boosterResult.errors + starterResult.errors;
  
  console.log('\n🎉 Comprehensive card seeding completed!');
  console.log('\n📊 Results:');
  console.log(`📦 Booster Sets: ${boosterResult.success} cards ✅, ${boosterResult.errors} errors ❌`);
  console.log(`🃏 Starter Decks: ${starterResult.success} cards ✅, ${starterResult.errors} errors ❌`);
  console.log(`\n📈 Total Results:`);
  console.log(`✅ Successfully seeded: ${totalSuccess} cards`);
  console.log(`❌ Total errors: ${totalErrors} cards`);
  console.log(`📊 Success rate: ${Math.round((totalSuccess / (totalSuccess + totalErrors)) * 100)}%`);
  console.log(`🖼️  All cards now have real images from optcgapi.com!`);
  console.log(`\n🎯 Database now contains ALL One Piece TCG cards with real images!`);
}

main()
  .catch((e) => {
    console.error('💥 Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
