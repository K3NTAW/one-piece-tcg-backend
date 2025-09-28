import axios from 'axios';

// Try to find real image URLs for starter deck cards
async function findRealImageUrls() {
  console.log('🔍 Searching for real One Piece TCG starter deck card images...');
  
  // Common image URL patterns to try
  const imagePatterns = [
    'https://www.onepiece-cardgame.com/images/cardlist/card/',
    'https://en.onepiece-cardgame.com/images/cardlist/card/',
    'https://images.onepiece-cardgame.com/cards/',
    'https://card-images.onepiece-cardgame.com/',
    'https://static.onepiece-cardgame.com/images/',
    'https://cdn.onepiece-cardgame.com/images/',
  ];
  
  // Test with some known starter deck cards
  const testCards = [
    'ST01-001', 'ST02-001', 'ST03-001', 'ST04-001', 'ST05-001',
    'ST06-001', 'ST07-001', 'ST08-001', 'ST09-001', 'ST10-001',
    'ST11-001', 'ST12-001', 'ST13-001', 'ST14-001', 'ST15-001',
    'ST16-001', 'ST17-001', 'ST18-001', 'ST19-001', 'ST20-001',
    'ST21-001', 'ST22-001', 'ST23-001', 'ST24-001', 'ST25-001',
    'ST26-001', 'ST27-001', 'ST28-001'
  ];
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  let foundPatterns: string[] = [];
  
  for (const pattern of imagePatterns) {
    console.log(`\n🔍 Testing pattern: ${pattern}`);
    let patternFound = false;
    
    for (const cardId of testCards.slice(0, 5)) { // Test first 5 cards
      for (const ext of imageExtensions) {
        const testUrl = `${pattern}${cardId}${ext}`;
        try {
          const response = await axios.head(testUrl, { timeout: 5000 });
          if (response.status === 200) {
            console.log(`  ✅ Found: ${testUrl}`);
            if (!patternFound) {
              foundPatterns.push(pattern);
              patternFound = true;
            }
            break; // Found working extension for this card
          }
        } catch (error) {
          // Image not found, continue
        }
      }
      if (patternFound) break; // Found working pattern
    }
    
    if (!patternFound) {
      console.log(`  ❌ No images found for this pattern`);
    }
  }
  
  if (foundPatterns.length > 0) {
    console.log(`\n🎉 Found working image patterns:`);
    foundPatterns.forEach(pattern => console.log(`  ✅ ${pattern}`));
    
    // Test a few more cards with the found patterns
    console.log(`\n🧪 Testing more cards with found patterns...`);
    for (const pattern of foundPatterns) {
      console.log(`\n📸 Testing pattern: ${pattern}`);
      for (const cardId of testCards.slice(5, 10)) {
        for (const ext of imageExtensions) {
          const testUrl = `${pattern}${cardId}${ext}`;
          try {
            const response = await axios.head(testUrl, { timeout: 5000 });
            if (response.status === 200) {
              console.log(`  ✅ ${cardId}: ${testUrl}`);
              break;
            }
          } catch (error) {
            // Image not found, continue
          }
        }
      }
    }
  } else {
    console.log(`\n❌ No working image patterns found`);
    console.log(`\n💡 Alternative approaches:`);
    console.log(`  1. Check the official website manually: https://en.onepiece-cardgame.com/cardlist/`);
    console.log(`  2. Use web scraping to extract image URLs`);
    console.log(`  3. Look for other One Piece TCG APIs or databases`);
    console.log(`  4. Contact the official One Piece TCG team for API access`);
  }
}

// Also try to find any other One Piece TCG APIs
async function findOtherAPIs() {
  console.log(`\n🔍 Searching for other One Piece TCG APIs...`);
  
  const potentialAPIs = [
    'https://api.onepiece-cardgame.com/',
    'https://optcgapi.com/api/',
    'https://onepiece-tcg-api.herokuapp.com/',
    'https://api.op-tcg.com/',
    'https://onepiece-tcg-db.herokuapp.com/',
  ];
  
  for (const api of potentialAPIs) {
    try {
      console.log(`  Testing: ${api}`);
      const response = await axios.get(api, { timeout: 5000 });
      console.log(`  ✅ API accessible: ${api}`);
      console.log(`  📊 Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
    } catch (error: any) {
      console.log(`  ❌ ${api}: ${error.message}`);
    }
  }
}

async function main() {
  await findRealImageUrls();
  await findOtherAPIs();
}

main()
  .catch((e) => {
    console.error('💥 Error:', e);
    process.exit(1);
  });
