// Test backend connectivity
const https = require('https');

const url = 'https://stagingaptservice.japaneast.cloudapp.azure.com/api/auth/login';

console.log('Testing backend connection...');
console.log('URL:', url);

const postData = JSON.stringify({
  email: 'test@example.com',
  password: 'test123'
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  },
  timeout: 10000
};

const req = https.request(url, options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.on('timeout', () => {
  console.error('Request timed out');
  req.destroy();
});

req.write(postData);
req.end();
