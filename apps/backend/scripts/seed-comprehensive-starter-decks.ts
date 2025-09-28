import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generate comprehensive starter deck cards systematically
function generateStarterDeckCards() {
  const cards: any[] = [];
  
  // Define starter deck information
  const starterDecks = [
    { id: 'ST-01', name: 'Straw Hat Crew', leader: 'Monkey.D.Luffy', color: 'Red' },
    { id: 'ST-02', name: 'Worst Generation', leader: 'Eustass "Captain" Kid', color: 'Red' },
    { id: 'ST-03', name: 'The Seven Warlords of the Sea', leader: 'Crocodile', color: 'Blue' },
    { id: 'ST-04', name: 'Animal Kingdom Pirates', leader: 'Kaido', color: 'Purple' },
    { id: 'ST-05', name: 'One Piece Film Edition', leader: 'Shanks', color: 'Red' },
    { id: 'ST-06', name: 'Absolute Justice', leader: 'Sakazuki', color: 'Black' },
    { id: 'ST-07', name: 'Big Mom Pirates', leader: 'Charlotte Linlin', color: 'Yellow' },
    { id: 'ST-08', name: 'Monkey D. Luffy', leader: 'Monkey.D.Luffy', color: 'Red' },
    { id: 'ST-09', name: 'Yamato', leader: 'Yamato', color: 'Green' },
    { id: 'ST-10', name: 'The Three Captains', leader: 'Monkey.D.Luffy', color: 'Red' },
    { id: 'ST-11', name: 'Uta', leader: 'Uta', color: 'Yellow' },
    { id: 'ST-12', name: 'Zoro and Sanji', leader: 'Roronoa Zoro', color: 'Red' },
    { id: 'ST-13', name: 'The Three Brothers', leader: 'Monkey.D.Luffy', color: 'Red' },
    { id: 'ST-14', name: '3D2Y', leader: 'Monkey.D.Luffy', color: 'Red' },
    { id: 'ST-15', name: 'Red Edward.Newgate', leader: 'Edward.Newgate', color: 'Red' },
    { id: 'ST-16', name: 'Green Uta', leader: 'Uta', color: 'Green' },
    { id: 'ST-17', name: 'Blue Donquixote Doflamingo', leader: 'Donquixote Doflamingo', color: 'Blue' },
    { id: 'ST-18', name: 'Purple Monkey.D.Luffy', leader: 'Monkey.D.Luffy', color: 'Purple' },
    { id: 'ST-19', name: 'Black Smoker', leader: 'Smoker', color: 'Black' },
    { id: 'ST-20', name: 'Yellow Charlotte Katakuri', leader: 'Charlotte Katakuri', color: 'Yellow' },
    { id: 'ST-21', name: 'GEAR5', leader: 'Monkey.D.Luffy', color: 'Red' },
    { id: 'ST-22', name: 'Ace & Newgate', leader: 'Portgas D. Ace & Edward Newgate', color: 'Blue' },
    { id: 'ST-23', name: 'Red Shanks', leader: 'Shanks', color: 'Red' },
    { id: 'ST-24', name: 'Green Jewelry Bonney', leader: 'Jewelry Bonney', color: 'Green' },
    { id: 'ST-25', name: 'Blue Buggy', leader: 'Buggy', color: 'Blue' },
    { id: 'ST-26', name: 'Purple/Black Monkey.D.Luffy', leader: 'Monkey.D.Luffy', color: 'Purple' },
    { id: 'ST-27', name: 'Black Marshall.D.Teach', leader: 'Marshall.D.Teach', color: 'Black' },
    { id: 'ST-28', name: 'Green/Yellow Yamato', leader: 'Yamato', color: 'Green' },
  ];

  // Generate cards for each starter deck
  for (const deck of starterDecks) {
    const setId = deck.id;
    const setName = deck.name;
    const leaderName = deck.leader;
    const color = deck.color;
    
    // Generate leader card
    cards.push({
      apiId: `${setId}-001`,
      cardNumber: '001',
      name: leaderName,
      setCode: setId,
      setName: setName,
      rarity: 'Leader',
      cardType: 'Leader',
      cost: null,
      power: null,
      counterPower: null,
      attribute: null,
      color: color,
      effectText: 'This Leader can attack the opponent\'s Leader even if there are Characters in play.',
      flavorText: null,
      imageUrl: `https://picsum.photos/300/420?random=${setId}-001`,
      smallImageUrl: `https://picsum.photos/200/280?random=${setId}-001`,
      largeImageUrl: `https://picsum.photos/400/560?random=${setId}-001`,
      isActive: true,
    });

    // Generate 10-15 character cards per deck
    const characterNames = [
      'Roronoa Zoro', 'Nami', 'Usopp', 'Sanji', 'Tony Tony Chopper',
      'Nico Robin', 'Franky', 'Brook', 'Jinbe', 'Trafalgar Law',
      'Eustass "Captain" Kid', 'Scratchmen Apoo', 'Basil Hawkins',
      'X Drake', 'Urouge', 'Jewelry Bonney', 'Capone "Gang" Bege',
      'Crocodile', 'Dracule Mihawk', 'Boa Hancock', 'Gecko Moria',
      'Kaido', 'King', 'Queen', 'Jack', 'Charlotte Linlin',
      'Charlotte Katakuri', 'Charlotte Perospero', 'Charlotte Smoothie',
      'Sakazuki', 'Borsalino', 'Issho', 'Smoker', 'Tashigi',
      'Shanks', 'Benn Beckman', 'Lucky Roux', 'Yasopp',
      'Yamato', 'Kozuki Momonosuke', 'Kozuki Hiyori',
      'Portgas D. Ace', 'Sabo', 'Monkey D. Dragon',
      'Uta', 'Shiki', 'Douglas Bullet', 'Buggy',
      'Marshall D. Teach', 'Shiryu', 'Laffitte', 'Van Augur',
      'Jesus Burgess', 'Doc Q', 'Avalo Pizarro', 'Sanjuan Wolf',
      'Vasco Shot', 'Catarina Devon', 'Stronger'
    ];

    // Generate 10 character cards per deck
    for (let i = 2; i <= 11; i++) {
      const characterName = characterNames[(i - 2) % characterNames.length];
      const cardNumber = i.toString().padStart(3, '0');
      
      cards.push({
        apiId: `${setId}-${cardNumber}`,
        cardNumber: cardNumber,
        name: characterName,
        setCode: setId,
        setName: setName,
        rarity: 'Common',
        cardType: 'Character',
        cost: Math.floor(Math.random() * 4) + 1, // 1-4 cost
        power: (Math.floor(Math.random() * 3) + 1) * 1000, // 1000-3000 power
        counterPower: 1000,
        attribute: ['Slash', 'Strike', 'Intellect'][Math.floor(Math.random() * 3)],
        color: color,
        effectText: null,
        flavorText: null,
        imageUrl: `https://picsum.photos/300/420?random=${setId}-${cardNumber}`,
        smallImageUrl: `https://picsum.photos/200/280?random=${setId}-${cardNumber}`,
        largeImageUrl: `https://picsum.photos/400/560?random=${setId}-${cardNumber}`,
        isActive: true,
      });
    }

    // Generate 3-5 event cards per deck
    const eventNames = [
      'Gum-Gum Pistol', 'Gum-Gum Jet Pistol', 'Gum-Gum Jet Gatling',
      'Gum-Gum Jet Bazooka', 'Magnetic Force', 'ROOM', 'Punk Gibson',
      'Punk Rotten', 'Sandstorm', 'Desert Spada', 'Desert La Spada',
      'Thunder Bagua', 'Boro Breath', 'Hakoku', 'El Thor',
      'Divine Departure', 'Conquest of the Sea', 'Honesty Impact',
      'Soul Pocus', 'Soul Solid', 'Soul Solid', 'Soul Solid',
      'Ice Block Partisan', 'Ice Block Pheasant Peck', 'Ice Block',
      'Haki', 'Color of Observation Haki', 'Color of Arms Haki',
      'Color of the Supreme King Haki', 'ROOM', 'Shambles',
      'Tact', 'Tact', 'Tact', 'Tact', 'Tact'
    ];

    for (let i = 12; i <= 15; i++) {
      const eventName = eventNames[(i - 12) % eventNames.length];
      const cardNumber = i.toString().padStart(3, '0');
      
      cards.push({
        apiId: `${setId}-${cardNumber}`,
        cardNumber: cardNumber,
        name: eventName,
        setCode: setId,
        setName: setName,
        rarity: 'Common',
        cardType: 'Event',
        cost: Math.floor(Math.random() * 4) + 1, // 1-4 cost
        power: null,
        counterPower: null,
        attribute: null,
        color: color,
        effectText: 'Deal damage to your opponent\'s Characters.',
        flavorText: null,
        imageUrl: `https://picsum.photos/300/420?random=${setId}-${cardNumber}`,
        smallImageUrl: `https://picsum.photos/200/280?random=${setId}-${cardNumber}`,
        largeImageUrl: `https://picsum.photos/400/560?random=${setId}-${cardNumber}`,
        isActive: true,
      });
    }

    // Generate 1-2 stage cards per deck
    const stageNames = [
      'Going Merry', 'Thousand Sunny', 'Punk Hazard', 'Dressrosa',
      'Whole Cake Island', 'Wano Country', 'Fish-Man Island',
      'Skypiea', 'Alabasta', 'Water 7', 'Enies Lobby',
      'Impel Down', 'Marineford', 'Sabaody Archipelago'
    ];

    for (let i = 16; i <= 17; i++) {
      const stageName = stageNames[(i - 16) % stageNames.length];
      const cardNumber = i.toString().padStart(3, '0');
      
      cards.push({
        apiId: `${setId}-${cardNumber}`,
        cardNumber: cardNumber,
        name: stageName,
        setCode: setId,
        setName: setName,
        rarity: 'Common',
        cardType: 'Stage',
        cost: 2,
        power: null,
        counterPower: null,
        attribute: null,
        color: color,
        effectText: 'When this Stage is played, draw 1 card.',
        flavorText: null,
        imageUrl: `https://picsum.photos/300/420?random=${setId}-${cardNumber}`,
        smallImageUrl: `https://picsum.photos/200/280?random=${setId}-${cardNumber}`,
        largeImageUrl: `https://picsum.photos/400/560?random=${setId}-${cardNumber}`,
        isActive: true,
      });
    }
  }

  return cards;
}

async function main() {
  console.log('🌱 Starting comprehensive One Piece TCG starter deck cards generation and seeding...');
  
  // Generate all starter deck cards
  const allCards = generateStarterDeckCards();
  console.log(`📚 Generated ${allCards.length} starter deck cards across ${28} starter decks`);

  let successCount = 0;
  let errorCount = 0;

  // Seed cards to database
  for (const cardData of allCards) {
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

  console.log(`\n🎉 Comprehensive starter deck seeding completed!`);
  console.log(`✅ Successfully seeded: ${successCount} cards`);
  console.log(`❌ Total errors: ${errorCount} cards`);
  console.log(`📊 Success rate: ${Math.round((successCount / (successCount + errorCount)) * 100)}%`);
  console.log(`📚 Cards added across ${28} starter decks`);
}

main()
  .catch((e) => {
    console.error('💥 Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
