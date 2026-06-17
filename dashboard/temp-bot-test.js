const http = require('http');
const data = JSON.stringify({ action: 'start' });
const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/bot',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  console.log('STATUS', res.statusCode);
  res.on('data', (chunk) => process.stdout.write(chunk));
  res.on('end', () => process.exit(0));
});

req.on('error', (err) => {
  console.error('ERR', err.message);
  process.exit(1);
});

req.write(data);
req.end();
