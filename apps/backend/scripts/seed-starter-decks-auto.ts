import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Different API endpoints to try for starter deck cards
const API_ENDPOINTS = [
  // Try OPTCG API with different formats
  'https://optcgapi.com/api/sets/ST01/',
  'https://optcgapi.com/api/sets/ST-01/',
  'https://optcgapi.com/api/cards/ST01-001',
  'https://optcgapi.com/api/cards/ST-01-001',
  
  // Try API TCG
  'https://api.tcgplayer.com/v1.39.0/catalog/categories/569001/products',
  'https://docs.apitcg.com/api-reference/cards',
  
  // Try different OPTCG API patterns
  'https://optcgapi.com/api/starter-decks/',
  'https://optcgapi.com/api/starter/',
  'https://optcgapi.com/api/decks/',
];

// Starter deck sets to try
const STARTER_DECK_SETS = [
  'ST01', 'ST02', 'ST03', 'ST04', 'ST05', 'ST06', 'ST07', 'ST08', 'ST09', 'ST10',
  'ST11', 'ST12', 'ST13', 'ST14', 'ST15', 'ST16', 'ST17', 'ST18', 'ST19', 'ST20',
  'ST21', 'ST22', 'ST23', 'ST24', 'ST25', 'ST26', 'ST27', 'ST28',
  'ST-01', 'ST-02', 'ST-03', 'ST-04', 'ST-05', 'ST-06', 'ST-07', 'ST-08', 'ST-09', 'ST-10',
  'ST-11', 'ST-12', 'ST-13', 'ST-14', 'ST-15', 'ST-16', 'ST-17', 'ST-18', 'ST-19', 'ST-20',
  'ST-21', 'ST-22', 'ST-23', 'ST-24', 'ST-25', 'ST-26', 'ST-27', 'ST-28',
];

// Individual card IDs to try (common starter deck cards)
const INDIVIDUAL_CARD_IDS = [
  'ST01-001', 'ST01-002', 'ST01-003', 'ST01-004', 'ST01-005',
  'ST02-001', 'ST02-002', 'ST02-003', 'ST02-004', 'ST02-005',
  'ST03-001', 'ST03-002', 'ST03-003', 'ST03-004', 'ST03-005',
  'ST04-001', 'ST04-002', 'ST04-003', 'ST04-004', 'ST04-005',
  'ST05-001', 'ST05-002', 'ST05-003', 'ST05-004', 'ST05-005',
  'ST06-001', 'ST06-002', 'ST06-003', 'ST06-004', 'ST06-005',
  'ST07-001', 'ST07-002', 'ST07-003', 'ST07-004', 'ST07-005',
  'ST08-001', 'ST08-002', 'ST08-003', 'ST08-004', 'ST08-005',
  'ST09-001', 'ST09-002', 'ST09-003', 'ST09-004', 'ST09-005',
  'ST10-001', 'ST10-002', 'ST10-003', 'ST10-004', 'ST10-005',
  'ST11-001', 'ST11-002', 'ST11-003', 'ST11-004', 'ST11-005',
  'ST12-001', 'ST12-002', 'ST12-003', 'ST12-004', 'ST12-005',
  'ST13-001', 'ST13-002', 'ST13-003', 'ST13-004', 'ST13-005',
  'ST14-001', 'ST14-002', 'ST14-003', 'ST14-004', 'ST14-005',
  'ST15-001', 'ST15-002', 'ST15-003', 'ST15-004', 'ST15-005',
  'ST16-001', 'ST16-002', 'ST16-003', 'ST16-004', 'ST16-005',
  'ST17-001', 'ST17-002', 'ST17-003', 'ST17-004', 'ST17-005',
  'ST18-001', 'ST18-002', 'ST18-003', 'ST18-004', 'ST18-005',
  'ST19-001', 'ST19-002', 'ST19-003', 'ST19-004', 'ST19-005',
  'ST20-001', 'ST20-002', 'ST20-003', 'ST20-004', 'ST20-005',
  'ST21-001', 'ST21-002', 'ST21-003', 'ST21-004', 'ST21-005',
  'ST22-001', 'ST22-002', 'ST22-003', 'ST22-004', 'ST22-005',
  'ST23-001', 'ST23-002', 'ST23-003', 'ST23-004', 'ST23-005',
  'ST24-001', 'ST24-002', 'ST24-003', 'ST24-004', 'ST24-005',
  'ST25-001', 'ST25-002', 'ST25-003', 'ST25-004', 'ST25-005',
  'ST26-001', 'ST26-002', 'ST26-003', 'ST26-004', 'ST26-005',
  'ST27-001', 'ST27-002', 'ST27-003', 'ST27-004', 'ST27-005',
  'ST28-001', 'ST28-002', 'ST28-003', 'ST28-004', 'ST28-005',
];

interface CardData {
  apiId: string;
  cardNumber: string;
  name: string;
  setCode: string;
  setName: string;
  rarity: string;
  cardType: string;
  cost: number | null;
  power: number | null;
  counterPower: number | null;
  attribute: string | null;
  color: string;
  effectText: string | null;
  flavorText: string | null;
  imageUrl: string;
  smallImageUrl: string;
  largeImageUrl: string;
  isActive: boolean;
}

async function tryFetchFromAPI(url: string): Promise<any> {
  try {
    console.log(`🔍 Trying API endpoint: ${url}`);
    const response = await axios.get(url, { timeout: 10000 });
    console.log(`✅ Success! Status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}`);
    return null;
  }
}

async function tryFetchStarterDeckSet(setId: string): Promise<CardData[]> {
  console.log(`\n🎯 Trying to fetch starter deck set: ${setId}`);
  
  const urls = [
    `https://optcgapi.com/api/sets/${setId}/`,
    `https://optcgapi.com/api/sets/${setId}`,
    `https://optcgapi.com/api/starter-decks/${setId}/`,
    `https://optcgapi.com/api/starter-decks/${setId}`,
  ];
  
  for (const url of urls) {
    const data = await tryFetchFromAPI(url);
    if (data && Array.isArray(data)) {
      console.log(`📦 Found ${data.length} cards from ${setId}`);
      return mapAPIDataToCards(data, setId);
    }
  }
  
  console.log(`⚠️  No data found for set ${setId}`);
  return [];
}

async function tryFetchIndividualCards(): Promise<CardData[]> {
  console.log(`\n🔍 Trying to fetch individual starter deck cards...`);
  
  const cards: CardData[] = [];
  let successCount = 0;
  
  for (const cardId of INDIVIDUAL_CARD_IDS.slice(0, 20)) { // Try first 20 to avoid too many requests
    const urls = [
      `https://optcgapi.com/api/cards/${cardId}`,
      `https://optcgapi.com/api/card/${cardId}`,
    ];
    
    for (const url of urls) {
      const data = await tryFetchFromAPI(url);
      if (data && data.name) {
        console.log(`✅ Found individual card: ${data.name} (${cardId})`);
        const mappedCard = mapIndividualCardToSchema(data, cardId);
        if (mappedCard) {
          cards.push(mappedCard);
          successCount++;
        }
        break; // Found the card, no need to try other URLs
      }
    }
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`📊 Individual card fetch results: ${successCount} cards found`);
  return cards;
}

function mapAPIDataToCards(apiData: any[], setId: string): CardData[] {
  return apiData.map((card: any) => {
    const setCode = setId.startsWith('ST-') ? setId : `ST-${setId.slice(2)}`;
    const cardNumber = card.card_set_id?.split('-')[1] || card.cardNumber || '001';
    
    return {
      apiId: card.card_set_id || `${setCode}-${cardNumber}`,
      cardNumber,
      name: card.card_name || card.name || 'Unknown Card',
      setCode,
      setName: card.set_name || `Starter Deck ${setId}`,
      rarity: mapRarity(card.rarity || 'Common'),
      cardType: mapCardType(card.card_type || card.type || 'Character'),
      cost: card.card_cost ? parseInt(card.card_cost) : null,
      power: card.card_power ? parseInt(card.card_power) : null,
      counterPower: null,
      attribute: card.attribute || null,
      color: mapColor(card.card_color || card.color || 'Red'),
      effectText: card.card_text || card.effectText || null,
      flavorText: null,
      imageUrl: card.card_image || card.imageUrl || `https://images.optcgapi.com/cards/${setCode}-${cardNumber}.jpg`,
      smallImageUrl: card.card_image || card.smallImageUrl || `https://images.optcgapi.com/cards/${setCode}-${cardNumber}.jpg`,
      largeImageUrl: card.card_image || card.largeImageUrl || `https://images.optcgapi.com/cards/${setCode}-${cardNumber}.jpg`,
      isActive: true,
    };
  });
}

function mapIndividualCardToSchema(cardData: any, cardId: string): CardData | null {
  if (!cardData.name) return null;
  
  const setId = cardId.split('-')[0];
  const cardNumber = cardId.split('-')[1];
  const setCode = setId.startsWith('ST') ? `ST-${setId.slice(2)}` : setId;
  
  return {
    apiId: cardId,
    cardNumber,
    name: cardData.name,
    setCode,
    setName: cardData.setName || `Starter Deck ${setId}`,
    rarity: mapRarity(cardData.rarity || 'Common'),
    cardType: mapCardType(cardData.cardType || cardData.type || 'Character'),
    cost: cardData.cost ? parseInt(cardData.cost) : null,
    power: cardData.power ? parseInt(cardData.power) : null,
    counterPower: null,
    attribute: cardData.attribute || null,
    color: mapColor(cardData.color || 'Red'),
    effectText: cardData.effectText || cardData.text || null,
    flavorText: null,
    imageUrl: cardData.imageUrl || cardData.image || `https://images.optcgapi.com/cards/${cardId}.jpg`,
    smallImageUrl: cardData.smallImageUrl || cardData.image || `https://images.optcgapi.com/cards/${cardId}.jpg`,
    largeImageUrl: cardData.largeImageUrl || cardData.image || `https://images.optcgapi.com/cards/${cardId}.jpg`,
    isActive: true,
  };
}

function mapRarity(rarity: string): string {
  const rarityMap: { [key: string]: string } = {
    'C': 'Common',
    'UC': 'Uncommon',
    'R': 'Rare',
    'SR': 'Super Rare',
    'SEC': 'Secret Rare',
    'L': 'Leader',
    'TR': 'Treasure Rare',
    'SP': 'Special',
  };
  return rarityMap[rarity] || rarity;
}

function mapCardType(type: string): string {
  return type;
}

function mapColor(color: string): string {
  return color;
}

async function seedCardsToDatabase(cards: CardData[]): Promise<{ success: number; errors: number }> {
  let successCount = 0;
  let errorCount = 0;
  
  for (const cardData of cards) {
    try {
      await prisma.card.upsert({
        where: { apiId: cardData.apiId },
        update: cardData,
        create: cardData,
      });
      console.log(`✅ Seeded: ${cardData.name} (${cardData.rarity}) from ${cardData.setCode}`);
      successCount++;
    } catch (error: any) {
      console.error(`❌ Error seeding ${cardData.name}: ${error.message}`);
      errorCount++;
    }
  }
  
  return { success: successCount, errors: errorCount };
}

async function main() {
  console.log('🌱 Starting automated One Piece TCG starter deck cards seeding...');
  console.log(`🔍 Will try ${STARTER_DECK_SETS.length} starter deck sets and ${INDIVIDUAL_CARD_IDS.length} individual cards`);
  
  let allCards: CardData[] = [];
  
  // Try fetching from starter deck sets
  console.log('\n📚 Phase 1: Trying to fetch starter deck sets...');
  for (const setId of STARTER_DECK_SETS.slice(0, 10)) { // Try first 10 to avoid too many requests
    const cards = await tryFetchStarterDeckSet(setId);
    allCards.push(...cards);
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Try fetching individual cards
  console.log('\n🃏 Phase 2: Trying to fetch individual cards...');
  const individualCards = await tryFetchIndividualCards();
  allCards.push(...individualCards);
  
  // Remove duplicates based on apiId
  const uniqueCards = allCards.filter((card, index, self) => 
    index === self.findIndex(c => c.apiId === card.apiId)
  );
  
  console.log(`\n📊 Fetch Results:`);
  console.log(`📦 Total cards found: ${allCards.length}`);
  console.log(`🔄 Duplicates removed: ${allCards.length - uniqueCards.length}`);
  console.log(`✅ Unique cards: ${uniqueCards.length}`);
  
  if (uniqueCards.length === 0) {
    console.log('⚠️  No cards found from APIs. The starter deck cards may not be available through these endpoints.');
    console.log('💡 Consider using the manual seeding approach or finding alternative data sources.');
    return;
  }
  
  // Seed cards to database
  console.log('\n🌱 Phase 3: Seeding cards to database...');
  const result = await seedCardsToDatabase(uniqueCards);
  
  console.log(`\n🎉 Automated starter deck seeding completed!`);
  console.log(`✅ Successfully seeded: ${result.success} cards`);
  console.log(`❌ Total errors: ${result.errors} cards`);
  console.log(`📊 Success rate: ${Math.round((result.success / (result.success + result.errors)) * 100)}%`);
}

main()
  .catch((e) => {
    console.error('💥 Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
