// Test dataset API endpoint
const API_BASE_URL = 'https://devaptservice.japaneast.cloudapp.azure.com';

async function testDatasetEndpoint() {
  try {
    console.log('Testing dataset endpoint availability...');
    
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
    
    // Test dataset detail API
    console.log('Testing dataset detail API...');
    const datasetResponse = await fetch(`${API_BASE_URL}/api/workspaces/1/datasets/1`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Dataset API response status:', datasetResponse.status);
    
    if (datasetResponse.ok) {
      const datasetData = await datasetResponse.json();
      console.log('✅ Dataset API works - Dataset name:', datasetData.name);
      return true;
    } else {
      const errorText = await datasetResponse.text();
      console.log('❌ Dataset API error:', errorText);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testDatasetEndpoint();
