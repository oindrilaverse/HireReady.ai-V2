import http from 'http';

function post(path, body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const req = http.request({
      host: 'localhost', port: 5000, path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('=== Testing /api/users/sync ===');
  const syncRes = await post('/api/users/sync', { authId: 'smoke-test-001', email: 'smoke@test.com', name: 'Smoke Test' });
  console.log('Status:', syncRes.status);
  console.log('Body:', syncRes.body.substring(0, 500));
}

run();
