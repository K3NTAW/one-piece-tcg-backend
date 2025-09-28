import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testImport() {
  try {
    console.log('🔍 Testing deck import with ST-22 cards...');
    
    // Check if ST-22 cards exist
    const st22Cards = await prisma.card.findMany({
      where: { setCode: 'ST-22' },
      take: 10
    });
    
    console.log(`📊 Found ${st22Cards.length} ST-22 cards:`);
    st22Cards.forEach(card => {
      console.log(`  - ${card.name} (${card.setCode}-${card.cardNumber})`);
    });
    
    // Test the specific cards from the deck list
    const testCards = [
      'Portgas D. Ace & Edward Newgate',
      'Izo',
      'Whitey Bay',
      'Squard',
      'Kingdew',
      'Atmos',
      'Marco',
      'Portgas D. Ace',
      'Take That Back!! Take Back What You Said!!',
      'I Am Whitebeard!!'
    ];
    
    console.log('\n🔍 Checking specific cards from deck list:');
    for (const cardName of testCards) {
      const card = await prisma.card.findFirst({
        where: {
          name: {
            contains: cardName,
            mode: 'insensitive'
          }
        }
      });
      
      if (card) {
        console.log(`  ✅ Found: ${card.name} (${card.setCode}-${card.cardNumber})`);
      } else {
        console.log(`  ❌ Not found: ${cardName}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testImport();