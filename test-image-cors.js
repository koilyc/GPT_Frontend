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
        
        if (imageResponse.status === 200) {
          console.log('✅ Image URL is accessible');
        } else {
          console.log('❌ Image URL returned non-200 status');
        }
      } catch (err) {
        console.log('❌ Image URL error:', err.message);
      }
      
      // Test CORS issues
      console.log('\n=== Testing CORS Issues ===');
      try {
        const corsTestResponse = await fetch(firstImage.path, {
          method: 'GET',
          mode: 'cors'
        });
        console.log('CORS test status:', corsTestResponse.status);
        console.log('✅ CORS is working');
      } catch (corsErr) {
        console.log('❌ CORS error:', corsErr.message);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testImageURLs();
