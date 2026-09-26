const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * Sends an HTTP/HTTPS request to Target HTTP Server.
 * 
 * @param {Object} options - Request configuration options.
 * @param {string} options.targetUrl - Required full destination URL (e.g., 'http://127.0.0.1:8080/api').
 * @param {string} [options.method='POST'] - HTTP method (e.g., 'GET', 'POST', 'PUT', 'DELETE').
 * @param {Object} [options.headers={}] - HTTP headers object.
 * @param {string|Buffer|Object} [options.body=''] - Request body payload.
 * @param {number} [options.timeout=5000] - Connection timeout in milliseconds.
 * @param {boolean} [options.rejectUnauthorized=true] - If false, accepts self-signed TLS/SSL certs.
 * @param {Function} [options.onData] - Optional callback triggered on incoming response data chunks `(chunk: Buffer) => void`.
 * @param {Function} [options.onEnd] - Optional callback triggered when the response stream completes `() => void`.
 * @param {Function} [options.onError] - Optional callback triggered when an error occurs on request or response `(err: Error) => void`.
 * @param {Function} [options.onClose] - Optional callback triggered when the underlying connection closes `() => void`.
 * @param {Function} [options.onDestroy] - Optional callback triggered when the request or socket stream is destroyed/closed `() => void`.
 * @param {Function} [options.onConnection] - Optional callback triggered when socket connection is established `(socket: net.Socket) => void`.
 * @returns {Promise<Object>} Resolves with `{ statusCode: number, headers: Object, body: Object|string }`
 */
function sendHttpRequest(options = {}) {
  return new Promise((resolve, reject) => {
    const {
      targetUrl,
      method = 'POST',
      headers = {},
      body = '',
      timeout = 5000,
      rejectUnauthorized = true,
      onData,
      onEnd,
      onError,
      onClose,
      onDestroy,
      onConnection
    } = options;

    if (!targetUrl) {
      return reject(new Error('Target URL is required for sendHttpRequest'));
    }

    const parsedUrl = new URL(targetUrl);
    const transport = parsedUrl.protocol === 'https:' ? https : http;

    const payload = typeof body === 'object' && body !== null && !Buffer.isBuffer(body)
      ? JSON.stringify(body)
      : body;

    const reqHeaders = {
      ...headers
    };

    if (payload && !reqHeaders['Content-Type'] && !reqHeaders['content-type']) {
      reqHeaders['Content-Type'] = 'application/json';
    }

    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: reqHeaders,
      timeout: timeout,
      rejectUnauthorized: rejectUnauthorized
    };

    const req = transport.request(requestOptions, (res) => {
      let responseData = [];

      res.on('data', (chunk) => {
        responseData.push(chunk);
        if (typeof onData === 'function') {
          onData(chunk);
        }
      });

      res.on('end', () => {
        if (typeof onEnd === 'function') {
          onEnd();
        }

        const responseBuffer = Buffer.concat(responseData);
        let parsedBody = responseBuffer.toString('utf8');

        try {
          parsedBody = JSON.parse(parsedBody);
        } catch (e) {
          // Keep as string if not valid JSON
        }

        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsedBody
        });
      });

      res.on('error', (err) => {
        if (typeof onError === 'function') {
          onError(err);
        }
      });

      res.on('close', () => {
        if (typeof onClose === 'function') {
          onClose();
        }
      });
    });

    req.on('socket', (socket) => {
      if (typeof onConnection === 'function') {
        if (socket.connecting) {
          socket.once('connect', () => {
            onConnection(socket);
          });
        } else {
          onConnection(socket);
        }
      }
    });

    req.on('close', () => {
      if (typeof onClose === 'function') {
        onClose();
      }
      if (typeof onDestroy === 'function') {
        onDestroy();
      }
    });

    req.on('timeout', () => {
      req.destroy(new Error(`HTTP Request timed out after ${timeout}ms`));
    });

    req.on('error', (err) => {
      if (typeof onError === 'function') {
        onError(err);
      }
      reject(err);
    });

    if (payload) {
      req.write(payload);
    }

    req.end();
  });
}

module.exports = {
  sendHttpRequest: sendHttpRequest
};