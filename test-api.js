// Test script to login and check workspace API pagination
const API_BASE_URL = 'http://localhost:8000';

async function testLogin() {
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
    console.log('Login successful:', loginData);

    // Test workspace API with different parameters
    const token = loginData.access_token;
    
    console.log('\nTesting workspace API...');
    
    // Test basic call
    const basicResponse = await fetch(`${API_BASE_URL}/api/workspaces`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const basicData = await basicResponse.json();
    console.log('Basic workspace response:', JSON.stringify(basicData, null, 2));
    
    // Test with potential pagination parameters
    const testParams = [
      'page=1&limit=10',
      'page=1&per_page=10', 
      'offset=0&limit=10',
      'page=1&size=10'
    ];
    
    for (const params of testParams) {
      try {
        console.log(`\nTesting with params: ${params}`);
        const testResponse = await fetch(`${API_BASE_URL}/api/workspaces?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const testData = await testResponse.json();
        console.log(`Response with ${params}:`, JSON.stringify(testData, null, 2));
      } catch (error) {
        console.log(`Error with ${params}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLogin();
