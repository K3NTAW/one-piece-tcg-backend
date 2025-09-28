import axios from 'axios';

async function testOPTCGDBAPI() {
  console.log('🔍 Testing OPTCGDB API for starter deck cards...');
  
  // Test different OPTCGDB API endpoints
  const apiEndpoints = [
    'https://api.optcgdb.com/cards/en/search',
    'https://api.optcgdb.com/cards/search',
    'https://optcgdb.com/api/cards/en/search',
    'https://optcgdb.com/api/cards/search',
    'https://api.optcgdb.com/v1/cards',
    'https://optcgdb.com/v1/cards',
  ];
  
  for (const endpoint of apiEndpoints) {
    try {
      console.log(`\n🔍 Testing: ${endpoint}`);
      
      // Test with different parameters
      const testParams = [
        { set: 'ST-01' },
        { setCode: 'ST-01' },
        { set_id: 'ST-01' },
        { series: 'ST-01' },
        { limit: 10 },
        {},
      ];
      
      for (const params of testParams) {
        try {
          console.log(`  📋 Testing with params: ${JSON.stringify(params)}`);
          const response = await axios.get(endpoint, { 
            params,
            timeout: 10000 
          });
          
          console.log(`  ✅ Success! Status: ${response.status}`);
          console.log(`  📊 Response type: ${typeof response.data}`);
          
          if (Array.isArray(response.data)) {
            console.log(`  📈 Found ${response.data.length} cards`);
            if (response.data.length > 0) {
              const firstCard = response.data[0];
              console.log(`  🃏 Sample card: ${JSON.stringify(firstCard, null, 2).substring(0, 200)}...`);
              
              // Check if it has image data
              if (firstCard.image || firstCard.card_image || firstCard.imageUrl) {
                console.log(`  🖼️  Image found: ${firstCard.image || firstCard.card_image || firstCard.imageUrl}`);
              }
            }
          } else if (response.data && typeof response.data === 'object') {
            console.log(`  📊 Response keys: ${Object.keys(response.data).join(', ')}`);
            if (response.data.cards && Array.isArray(response.data.cards)) {
              console.log(`  📈 Found ${response.data.cards.length} cards in data.cards`);
            }
            if (response.data.data && Array.isArray(response.data.data)) {
              console.log(`  📈 Found ${response.data.data.length} cards in data.data`);
            }
          }
          
          // If we found cards, break out of param testing
          if ((Array.isArray(response.data) && response.data.length > 0) ||
              (response.data && response.data.cards && response.data.cards.length > 0) ||
              (response.data && response.data.data && response.data.data.length > 0)) {
            console.log(`  🎉 Found working endpoint with cards!`);
            break;
          }
          
        } catch (paramError: any) {
          console.log(`  ❌ Params failed: ${paramError.message}`);
        }
      }
      
    } catch (error: any) {
      console.log(`  ❌ Endpoint failed: ${error.message}`);
    }
  }
  
  // Also test the current optcgapi.com to see what we're missing
  console.log(`\n🔍 Testing current optcgapi.com for starter decks...`);
  try {
    const response = await axios.get('https://optcgapi.com/api/cards/', { timeout: 10000 });
    console.log(`  ✅ optcgapi.com accessible`);
    console.log(`  📊 Response type: ${typeof response.data}`);
    
    if (Array.isArray(response.data)) {
      console.log(`  📈 Found ${response.data.length} total cards`);
      
      // Check for starter deck cards
      const starterCards = response.data.filter((card: any) => 
        card.set_id && card.set_id.startsWith('ST-')
      );
      console.log(`  🃏 Found ${starterCards.length} starter deck cards`);
      
      if (starterCards.length > 0) {
        const sampleCard = starterCards[0];
        console.log(`  🃏 Sample starter card: ${JSON.stringify(sampleCard, null, 2).substring(0, 300)}...`);
      }
    }
  } catch (error: any) {
    console.log(`  ❌ optcgapi.com failed: ${error.message}`);
  }
}

testOPTCGDBAPI()
  .catch((e) => {
    console.error('💥 Error:', e);
    process.exit(1);
  });
