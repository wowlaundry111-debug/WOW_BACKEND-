const https = require('https');

const data = JSON.stringify({ email: 'salgotraaditya555@gmail.com' });

const options = {
  hostname: 'backend-5r04.onrender.com',
  port: 443,
  path: '/api/auth/send-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', body));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
