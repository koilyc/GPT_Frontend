// Test script for dataset image upload
const API_BASE_URL = 'http://localhost:8000';

async function testImageUpload() {
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
    const workspaceId = 1;
    const datasetId = 1;
    
    // Test getting images first
    console.log('\nTesting get images...');
    const getResponse = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceId}/datasets/${datasetId}/images`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (getResponse.ok) {
      const imagesData = await getResponse.json();
      console.log('Current images:', JSON.stringify(imagesData, null, 2));
    } else {
      console.log('Error getting images:', await getResponse.text());
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testImageUpload();
