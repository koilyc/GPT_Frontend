// Test dataset images API pagination more thoroughly
const API_BASE_URL = 'https://devaptservice.japaneast.cloudapp.azure.com';

async function testPaginationThoroughly() {
  try {
    console.log('Testing dataset images API pagination thoroughly...');
    
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: '@Password456'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    
    console.log('✅ Login successful');
    
    // Test page 1
    console.log('\n--- Testing Page 1 (limit: 2) ---');
    const page1Params = new URLSearchParams({
      page: '1',
      limit: '2'
    });
    
    const page1Response = await fetch(`${API_BASE_URL}/api/workspaces/1/datasets/1/images?${page1Params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (page1Response.ok) {
      const page1Data = await page1Response.json();
      console.log('Page 1 - Total count:', page1Data.total_count);
      console.log('Page 1 - Images returned:', page1Data.Images.length);
      console.log('Page 1 - First image:', page1Data.Images[0]?.name || 'No images');
      console.log('Page 1 - Image IDs:', page1Data.Images.map(img => img.id));
    } else {
      console.log('❌ Page 1 failed:', page1Response.status);
    }
    
    // Test page 2
    console.log('\n--- Testing Page 2 (limit: 2) ---');
    const page2Params = new URLSearchParams({
      page: '2',
      limit: '2'
    });
    
    const page2Response = await fetch(`${API_BASE_URL}/api/workspaces/1/datasets/1/images?${page2Params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (page2Response.ok) {
      const page2Data = await page2Response.json();
      console.log('Page 2 - Total count:', page2Data.total_count);
      console.log('Page 2 - Images returned:', page2Data.Images.length);
      console.log('Page 2 - First image:', page2Data.Images[0]?.name || 'No images');
      console.log('Page 2 - Image IDs:', page2Data.Images.map(img => img.id));
    } else {
      console.log('❌ Page 2 failed:', page2Response.status);
    }
    
    // Test without pagination
    console.log('\n--- Testing without pagination ---');
    const noPagingResponse = await fetch(`${API_BASE_URL}/api/workspaces/1/datasets/1/images`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (noPagingResponse.ok) {
      const noPagingData = await noPagingResponse.json();
      console.log('No paging - Total count:', noPagingData.total_count);
      console.log('No paging - Images returned:', noPagingData.Images.length);
      console.log('No paging - All image IDs:', noPagingData.Images.map(img => img.id));
    } else {
      console.log('❌ No paging failed:', noPagingResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPaginationThoroughly();
