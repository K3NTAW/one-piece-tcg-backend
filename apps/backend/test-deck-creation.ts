import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function testDeckCreation() {
  console.log('🧪 Testing deck creation with leader assignment...');
  
  // Read the test deck file
  const deckListText = fs.readFileSync('test-deck.txt', 'utf8');
  console.log('📄 Test deck list loaded');
  
  // Parse the deck list (simplified version of the import logic)
  const lines = deckListText.split('\n').map(line => line.trim()).filter(line => line);
  
  let deckName = 'Test Deck';
  let leaderCard = null;
  const cards: Array<{ name: string; setCode: string; cardNumber: string; quantity: number }> = [];

  const nameLine = lines.find(line => line.startsWith('Deck Name:'));
  if (nameLine) {
    deckName = nameLine.replace('Deck Name:', '').trim();
  }

  const cardLines = lines.filter(line => 
    line.startsWith('*') || 
    /^\d+\s+/.test(line)
  );
  
  console.log(`📋 Found ${cardLines.length} card lines to parse`);
  
  for (const line of cardLines) {
    let match;
    
    // Try format with asterisk first: * quantity Card Name SetCode CardNumber
    match = line.match(/\*\s+(\d+)\s+(.+?)\s+([A-Z0-9-]+)\s+([A-Z0-9-]+)$/);
    
    // If no match, try format without asterisk: quantity Card Name SetCode CardNumber
    if (!match) {
      match = line.match(/^(\d+)\s+(.+?)\s+([A-Z0-9-]+)\s+([A-Z0-9-]+)$/);
    }
    
    if (match) {
      const [, quantity, cardName, setCode, cardNumber] = match;
      
      const isLeader = line.includes('Leader') || 
                      cardName.toLowerCase().includes('leader') ||
                      cardName.includes('&') || 
                      (cardName.includes('Ace') && cardName.includes('Whitebeard')); 
      
      if (isLeader) {
        leaderCard = {
          name: cardName,
          setCode,
          cardNumber,
        };
        console.log(`👑 Found leader: ${cardName} (${setCode} ${cardNumber})`);
      } else {
        cards.push({
          name: cardName,
          setCode,
          cardNumber,
          quantity: parseInt(quantity),
        });
        console.log(`🃏 Found card: ${quantity}x ${cardName} (${setCode} ${cardNumber})`);
      }
    }
  }

  console.log(`\n📊 Parsing Results:`);
  console.log(`📝 Deck Name: ${deckName}`);
  console.log(`👑 Leader: ${leaderCard ? leaderCard.name : 'None'}`);
  console.log(`🃏 Other Cards: ${cards.length} different cards`);

  // Find leader in database
  let leader = null;
  if (leaderCard) {
    console.log(`\n🔍 Looking for leader in database...`);
    
    // Try exact match first
    leader = await prisma.card.findFirst({
      where: {
        name: leaderCard.name,
        setCode: leaderCard.setCode,
        cardType: 'Leader',
      },
    });
    
    if (leader) {
      console.log(`✅ Leader found (exact match): ${leader.name} (${leader.setCode}) - ID: ${leader.id}`);
    } else {
      // Try partial name match
      leader = await prisma.card.findFirst({
        where: {
          name: {
            contains: leaderCard.name.split(' ')[0], 
            mode: 'insensitive',
          },
          setCode: leaderCard.setCode,
          cardType: 'Leader',
        },
      });
      
      if (leader) {
        console.log(`✅ Leader found (partial match): ${leader.name} (${leader.setCode}) - ID: ${leader.id}`);
      } else {
        console.log(`❌ Leader not found: ${leaderCard.name} (${leaderCard.setCode})`);
      }
    }
  }

  // Create a test deck
  console.log(`\n🏗️ Creating test deck...`);
  const deck = await prisma.deck.create({
    data: {
      name: deckName,
      description: `Test imported deck from deck list`,
      userId: 'test-user-id', // Using a test user ID
      isPublic: false,
      leaderId: leader?.id || null,
    },
  });

  console.log(`✅ Deck created with ID: ${deck.id}`);
  console.log(`👑 Leader ID set to: ${deck.leaderId}`);

  // Fetch the deck with leader relation to verify
  const deckWithLeader = await prisma.deck.findUnique({
    where: { id: deck.id },
    include: {
      leader: true,
    },
  });

  console.log(`\n🔍 Deck verification:`);
  console.log(`📝 Deck Name: ${deckWithLeader?.name}`);
  console.log(`👑 Leader ID: ${deckWithLeader?.leaderId}`);
  console.log(`👑 Leader Name: ${deckWithLeader?.leader?.name || 'None'}`);
  console.log(`👑 Leader Set: ${deckWithLeader?.leader?.setCode || 'None'}`);

  if (deckWithLeader?.leader) {
    console.log(`✅ SUCCESS: Leader is properly assigned to the deck!`);
  } else {
    console.log(`❌ PROBLEM: Leader is not assigned to the deck!`);
  }

  // Clean up test deck
  await prisma.deck.delete({
    where: { id: deck.id },
  });
  console.log(`\n🧹 Test deck cleaned up`);
}

testDeckCreation()
  .catch((e) => {
    console.error('💥 Test error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
