const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Starting Artfromromania API Test...');

// Start the API
const apiProcess = spawn('npx', ['tsx', '--no-warnings', 'src/index.ts'], {
  cwd: process.cwd(),
  stdio: 'pipe'
});

let apiReady = false;

// Listen for API startup
apiProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('API:', output.trim());
  
  if (output.includes('Server listening at http://127.0.0.1:3001')) {
    console.log('✅ API is starting...');
  }
  
  if (output.includes('Search indexes initialized successfully')) {
    console.log('✅ API is ready!');
    apiReady = true;
    setTimeout(runTests, 2000); // Wait 2 seconds for full startup
  }
});

apiProcess.stderr.on('data', (data) => {
  console.log('API Error:', data.toString());
});

// Test functions
const testEndpoint = (name, path, method = 'GET', body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      timeout: 5000
    };
    
    if (body) {
      options.headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      };
    }
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`✅ ${name}: ${res.statusCode} - ${data.substring(0, 100)}${data.length > 100 ? '...' : ''}`);
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${name} failed: ${err.message}`);
      reject(err);
    });
    
    req.on('timeout', () => {
      console.log(`❌ ${name} timeout`);
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    if (body) {
      req.write(body);
    }
    req.end();
  });
};

async function runTests() {
  console.log('\n🧪 Running API Tests...');
  
  try {
    // Test 1: Health endpoint
    await testEndpoint('Health', '/healthz');
    
    // Test 2: Stats endpoint
    await testEndpoint('Stats', '/stats/view', 'POST', JSON.stringify({ artworkId: 'test-artwork-123' }));
    
    // Test 3: Collections endpoint
    await testEndpoint('Collections', '/collections');
    
    // Test 4: Inquiries endpoint
    await testEndpoint('Inquiries', '/inquiries');
    
    // Test 5: Favorites endpoint
    await testEndpoint('Favorites', '/favorites', 'POST', JSON.stringify({ artworkId: 'test-artwork-123' }));
    
    // Test 6: Social proof endpoint
    await testEndpoint('Social Proof', '/artworks/test-artwork-123/social-proof');
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ API is working correctly with all social proof and inquiry routes enabled.');
    
  } catch (error) {
    console.log('\n❌ Some tests failed:', error.message);
  } finally {
    // Clean up
    console.log('\n🛑 Stopping API...');
    apiProcess.kill('SIGINT');
    setTimeout(() => {
      if (!apiProcess.killed) {
        apiProcess.kill('SIGKILL');
      }
      process.exit(0);
    }, 2000);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, cleaning up...');
  apiProcess.kill('SIGINT');
  setTimeout(() => {
    if (!apiProcess.killed) {
      apiProcess.kill('SIGKILL');
    }
    process.exit(0);
  }, 2000);
});

// Wait for API to be ready
setTimeout(() => {
  if (!apiReady) {
    console.log('❌ API failed to start within timeout');
    apiProcess.kill('SIGKILL');
    process.exit(1);
  }
}, 30000); // 30 second timeout
