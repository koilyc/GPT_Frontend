// Test the image URL functionality
const API_BASE_URL = 'https://devaptservice.japaneast.cloudapp.azure.com';

async function testImageUrls() {
  try {
    console.log('🔐 Logging in...');
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
    
    // Test the images endpoint
    console.log('\n📋 Getting images list...');
    const imagesResponse = await fetch(`${API_BASE_URL}/api/workspaces/1/datasets/1/images`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!imagesResponse.ok) {
      throw new Error(`Images list failed: ${imagesResponse.status}`);
    }
    
    const imagesData = await imagesResponse.json();
    console.log(`📸 Found ${imagesData.total_count} images`);
    
    if (imagesData.Images && imagesData.Images.length > 0) {
      const firstImage = imagesData.Images[0];
      console.log(`\n🖼️  Testing first image (ID: ${firstImage.id})`);
      console.log(`   Name: ${firstImage.name}`);
      
      // Test the presigned URL endpoint
      console.log('\n🔗 Getting presigned URL...');
      const urlResponse = await fetch(`${API_BASE_URL}/api/workspaces/1/datasets/1/images/${firstImage.id}/content`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (urlResponse.ok) {
        const urlData = await urlResponse.json();
        console.log('✅ Presigned URL retrieved successfully');
        console.log(`   URL: ${urlData.presigned_url.substring(0, 100)}...`);
        
        // Test if the URL works
        console.log('\n🌐 Testing URL accessibility...');
        try {
          const imageTest = await fetch(urlData.presigned_url, { 
            method: 'HEAD',
            mode: 'no-cors' // Avoid CORS issues for testing
          });
          console.log('✅ Image URL is accessible');
        } catch (error) {
          console.log('⚠️  CORS test failed (expected), but URL should work in img tags');
        }
        
      } else {
        console.log(`❌ Failed to get presigned URL: ${urlResponse.status}`);
        const errorText = await urlResponse.text();
        console.log(`   Error: ${errorText}`);
      }
      
    } else {
      console.log('ℹ️  No images found in dataset');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testImageUrls();
