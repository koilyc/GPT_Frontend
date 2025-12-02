// Test script for Azure dataset image API
const API_BASE_URL = 'https://devaptservice.japaneast.cloudapp.azure.com';

async function testAzureImageAPI() {
  try {
    console.log('Testing Azure API...');
    console.log('API Base URL:', API_BASE_URL);
    
    console.log('\nAttempting login...');
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
      const errorText = await loginResponse.text();
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}\n${errorText}`);
    }

    const loginData = await loginResponse.json();
    console.log('Login successful!');

    const token = loginData.access_token;
    const workspaceId = 1;
    const datasetId = 1;
    
    // Test getting dataset info
    console.log('\nTesting get dataset...');
    const datasetResponse = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceId}/datasets/${datasetId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (datasetResponse.ok) {
      const datasetData = await datasetResponse.json();
      console.log('Dataset info:', JSON.stringify(datasetData, null, 2));
    } else {
      const errorText = await datasetResponse.text();
      console.log('Error getting dataset:', datasetResponse.status, errorText);
    }
    
    // Test getting images
    console.log('\nTesting get images...');
    const getResponse = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceId}/datasets/${datasetId}/images`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (getResponse.ok) {
      const imagesData = await getResponse.json();
      console.log('Images response:', JSON.stringify(imagesData, null, 2));
      
      // Check each image for missing properties
      if (imagesData.Images && imagesData.Images.length > 0) {
        console.log('\nChecking image properties:');
        imagesData.Images.forEach((img, index) => {
          console.log(`Image ${index}:`, {
            id: img.id,
            filename: img.filename,
            file_path: img.file_path,
            file_size: img.file_size,
            width: img.width,
            height: img.height,
            upload_date: img.upload_date
          });
          
          if (!img.file_path) {
            console.warn(`⚠️  Image ${index} has no file_path!`);
          }
        });
      }
    } else {
      const errorText = await getResponse.text();
      console.log('Error getting images:', getResponse.status, errorText);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAzureImageAPI();
