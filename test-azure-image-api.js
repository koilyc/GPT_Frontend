// Test Azure API for image endpoints
const API_BASE_URL = 'https://devaptservice.japaneast.cloudapp.azure.com';

async function testImageURLs() {
  try {
    console.log('Testing login...');
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
    
    // Get images list
    console.log('\n=== Testing Images List ===');
    const imagesResponse = await fetch(`${API_BASE_URL}/api/workspaces/1/datasets/1/images`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const imagesData = await imagesResponse.json();
    console.log('Images count:', imagesData.total_count);
    
    if (imagesData.Images && imagesData.Images.length > 0) {
      const firstImage = imagesData.Images[0];
      console.log('\nFirst image data:');
      console.log('- ID:', firstImage.id);
      console.log('- Name:', firstImage.name);  
      console.log('- Path:', firstImage.path);
      console.log('- Path starts with http:', firstImage.path && firstImage.path.startsWith('http'));
      
      // Test if the image URL is accessible
      console.log('\n=== Testing Image URL Accessibility ===');
      try {
        const imageResponse = await fetch(firstImage.path, {
          method: 'HEAD' // Only get headers, not full image data
        });
        console.log('Image URL status:', imageResponse.status);
        console.log('Image content-type:', imageResponse.headers.get('content-type'));
        console.log('Image content-length:', imageResponse.headers.get('content-length'));
      } catch (err) {
        console.log('Image URL error:', err.message);
      }
    }
    const token = loginData.access_token;
    
    // Test various image access endpoints
    const imageId = 1;
    const workspaceId = 1;
    const datasetId = 1;
    
    console.log('\nTesting image access endpoints...');
    const endpoints = [
      `/api/workspaces/${workspaceId}/datasets/${datasetId}/images/${imageId}`,
      `/api/workspaces/${workspaceId}/datasets/${datasetId}/images/${imageId}/download`,
      `/api/workspaces/${workspaceId}/datasets/${datasetId}/images/${imageId}/view`,
      `/api/workspaces/${workspaceId}/datasets/${datasetId}/images/${imageId}/content`,
      `/api/images/${imageId}`,
      `/api/images/${imageId}/download`,
      `/api/images/${imageId}/url`,
      `/api/images/${imageId}/presigned-url`,
      `/api/files/download/${imageId}`,
      `/api/storage/images/${imageId}`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`${endpoint}: ${response.status}`);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('json')) {
            const data = await response.json();
            console.log(`  Response: ${JSON.stringify(data).substring(0, 200)}...`);
          } else if (contentType && contentType.startsWith('image/')) {
            console.log(`  Response: Image data (${contentType})`);
          } else {
            console.log(`  Response: ${contentType || 'Unknown content type'}`);
          }
        } else if (response.status !== 404) {
          const text = await response.text();
          console.log(`  Error: ${text.substring(0, 100)}...`);
        }
      } catch (e) {
        console.log(`${endpoint}: error - ${e.message}`);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testImageURLs();

async function getImageDetails() {
  try {
    console.log('\n=== Getting Single Image Details ===');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: '@Password456'
      })
    });

    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    
    const imageResponse = await fetch(`${API_BASE_URL}/api/workspaces/1/datasets/1/images/1`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const imageData = await imageResponse.json();
    console.log('Single image details:');
    console.log(JSON.stringify(imageData, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

getImageDetails();
