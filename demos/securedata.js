const { sendHttpRequest } = require('../index');

async function fetchSecureData() {
  try {
    const response = await sendHttpRequest({
      targetUrl: 'https://127.0.0.1:8443/api/secure-data',
      method: 'GET',
      rejectUnauthorized: false, // Accepts self-signed TLS certificates
      timeout: 5000
    });

    console.log('Status Code:', response.statusCode);
    console.log('Secure Data:', response.body);
  } catch (err) {
    console.error('HTTPS Request Error:', err.message);
  }
}

fetchSecureData();