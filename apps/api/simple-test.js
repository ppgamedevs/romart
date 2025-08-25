const http = require('http');

console.log('Testing API endpoints...');

// Test health endpoint
const testHealth = () => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/healthz',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`✅ Health endpoint: ${res.statusCode} - ${data}`);
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Health endpoint failed: ${err.message}`);
      reject(err);
    });
    
    req.on('timeout', () => {
      console.log('❌ Health endpoint timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
};

// Test stats endpoint
const testStats = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ artworkId: 'test-artwork-123' });
    
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/stats/view',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`✅ Stats endpoint: ${res.statusCode} - ${data}`);
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Stats endpoint failed: ${err.message}`);
      reject(err);
    });
    
    req.on('timeout', () => {
      console.log('❌ Stats endpoint timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.write(postData);
    req.end();
  });
};

// Test collections endpoint
const testCollections = () => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/collections',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`✅ Collections endpoint: ${res.statusCode} - ${data}`);
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Collections endpoint failed: ${err.message}`);
      reject(err);
    });
    
    req.on('timeout', () => {
      console.log('❌ Collections endpoint timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
};

// Run tests
async function runTests() {
  try {
    await testHealth();
    await testStats();
    await testCollections();
    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.log('\n❌ Some tests failed');
  }
}

runTests();
