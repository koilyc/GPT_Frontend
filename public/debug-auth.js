// 調試腳本：設置認證 token
const token = "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJyb2xlIjpudWxsLCJpc3MiOiJsb2NhbCIsImV4cCI6MTc1Mjc1NjYyNiwic2NvcGUiOiJhY2Nlc3MifQ.M4bhdggwpQw214om1rsV4raZZ_oAhJ--IXYsserOBhE4BhZ_vyaibohPhIA57EHLrWp3B6514Kdh1APIX7k-XA";

// 設置到 localStorage
localStorage.setItem('access_token', token);

// 模擬用戶數據
const mockUser = {
  id: "2",
  email: "test@example.com",
  username: "testuser",
  first_name: "Test",
  last_name: "User",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// 設置到 Zustand store
const authStorageData = {
  state: {
    user: mockUser,
    token: token,
    isAuthenticated: true
  },
  version: 0
};

localStorage.setItem('auth-storage', JSON.stringify(authStorageData));

console.log('Token and user data set successfully!');
console.log('Please refresh the page to apply changes.');
