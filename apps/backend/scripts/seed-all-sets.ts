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

// All booster sets from OP-01 to OP-12
const BOOSTER_SETS = [
  'OP-01', 'OP-02', 'OP-03', 'OP-04', 'OP-05', 'OP-06',
  'OP-07', 'OP-08', 'OP-09', 'OP-10', 'OP-11', 'OP-12'
];

// Note: Starter decks (ST-01 to ST-28) are not available through the /api/sets/ endpoint
// They would need to be accessed individually by card ID (e.g., ST06-014) if available

async function fetchOPTCGCards(setId: string): Promise<OPTCGCard[]> {
  try {
    console.log(`🔍 Fetching cards from OPTCG API for set ${setId}...`);
    const response = await axios.get(`https://optcgapi.com/api/sets/${setId}/`);
    console.log(`📦 Fetched ${response.data.length} cards from ${setId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching cards for set ${setId}:`, error.message);
    return [];
  }
}

function mapRarity(optcgRarity: string): string {
  switch (optcgRarity) {
    case 'C': return 'Common';
    case 'UC': return 'Uncommon';
    case 'R': return 'Rare';
    case 'SR': return 'Super Rare';
    case 'SEC': return 'Secret Rare';
    case 'L': return 'Leader';
    default: return optcgRarity;
  }
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
    smallImageUrl: card.card_image, // Use same image for both
    largeImageUrl: card.card_image,
    isActive: true,
  };
}

async function seedCardsFromSet(setId: string): Promise<{ success: number; errors: number }> {
  const cards = await fetchOPTCGCards(setId);
  
  if (cards.length === 0) {
    console.log(`⚠️  No cards found for set ${setId}, skipping...`);
    return { success: 0, errors: 0 };
  }

  let successCount = 0;
  let errorCount = 0;

  for (const cardData of cards) {
    try {
      const mappedCard = mapOPTCGToOurSchema(cardData);
      
      // Use upsert to handle duplicates gracefully
      await prisma.card.upsert({
        where: { apiId: mappedCard.apiId },
        update: mappedCard,
        create: mappedCard,
      });
      
      console.log(`✅ Seeded card: ${mappedCard.name} (${mappedCard.rarity}) from ${setId}`);
      successCount++;
    } catch (e) {
      console.error(`❌ Error seeding card ${cardData.card_name} from ${setId}:`, e.message);
      errorCount++;
    }
  }

  return { success: successCount, errors: errorCount };
}

async function main() {
  console.log('🌱 Starting comprehensive One Piece TCG card database seeding...');
  console.log(`📚 Booster Sets: ${BOOSTER_SETS.join(', ')}`);
  console.log(`📦 Total Sets: ${BOOSTER_SETS.length}`);
  console.log(`ℹ️  Note: Starter decks (ST-01 to ST-28) are not available through the /api/sets/ endpoint`);

  // Clear existing cards to start fresh
  console.log('🗑️ Clearing existing cards...');
  await prisma.card.deleteMany({});
  console.log('✅ Existing cards cleared.');

  let totalSuccess = 0;
  let totalErrors = 0;
  const setResults: { [key: string]: { success: number; errors: number } } = {};

  // Seed each set
  for (const setId of BOOSTER_SETS) {
    console.log(`\n🎯 Processing set ${setId}...`);
    const result = await seedCardsFromSet(setId);
    setResults[setId] = result;
    totalSuccess += result.success;
    totalErrors += result.errors;
    
    // Small delay between sets to be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Print summary
  console.log('\n🎉 Card seeding completed!');
  console.log('📊 Summary by set:');
  
  for (const [setId, result] of Object.entries(setResults)) {
    console.log(`  ${setId}: ${result.success} cards ✅, ${result.errors} errors ❌`);
  }
  
  console.log(`\n📈 Total Results:`);
  console.log(`✅ Successfully seeded: ${totalSuccess} cards`);
  console.log(`❌ Total errors: ${totalErrors} cards`);
  console.log(`📚 Sets processed: ${BOOSTER_SETS.length} booster sets`);
  console.log(`ℹ️  Starter decks (ST-01 to ST-28) are not available through the current API`);
}

main()
  .catch((e) => {
    console.error('💥 Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
