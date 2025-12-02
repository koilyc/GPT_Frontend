// Test dataset images API with pagination
const API_BASE_URL = 'https://devaptservice.japaneast.cloudapp.azure.com';

async function testDatasetImagesPagination() {
  try {
    console.log('Testing dataset images API with pagination...');
    
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
    
    // Test dataset images API with pagination
    console.log('Testing images API with pagination parameters...');
    const params = new URLSearchParams({
      page: '1',
      limit: '5'
    });
    
    const imagesResponse = await fetch(`${API_BASE_URL}/api/workspaces/1/datasets/1/images?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Images API response status:', imagesResponse.status);
    
    if (imagesResponse.ok) {
      const imagesData = await imagesResponse.json();
      console.log('✅ Images API works with pagination');
      console.log('Total count:', imagesData.total_count);
      console.log('Images returned:', imagesData.Images.length);
      console.log('First image:', imagesData.Images[0]?.name || 'No images');
      return true;
    } else {
      const errorText = await imagesResponse.text();
      console.log('❌ Images API error:', errorText);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testDatasetImagesPagination();
