// Test script for dataset images API
const API_BASE_URL = 'http://localhost:8000';

async function testDatasetImages() {
  try {
    console.log('Attempting login...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: '@Password456'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    console.log('Login successful!');

    const token = loginData.access_token;
    const workspaceId = 1; // test workspace
    const datasetId = 1; // assuming there's a dataset with id 1
    
    // Test different potential dataset image endpoints
    const testEndpoints = [
      `/api/workspaces/${workspaceId}/datasets/${datasetId}/images`,
      `/api/datasets/${datasetId}/images`,
      `/api/workspaces/${workspaceId}/datasets/${datasetId}/files`,
      `/api/datasets/${datasetId}/files`,
      `/datasets/${datasetId}/images`,
      `/workspaces/${workspaceId}/datasets/${datasetId}/images`
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`\nTesting endpoint: ${endpoint}`);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`Status: ${response.status}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`Success! Data:`, JSON.stringify(data, null, 2));
        } else {
          const errorText = await response.text();
          console.log(`Error: ${errorText}`);
        }
      } catch (error) {
        console.log(`Error testing ${endpoint}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDatasetImages();
