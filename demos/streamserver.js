const http = require('http');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Handles incoming file upload streams directly using Node.js writable streams.
 * Pipes the request body stream straight to disk without buffering in memory.
 */
const server = http.createServer((req, res) => {
  const url = req.url;
  const method = req.method;

  if (url === '/api/upload/stream' && method === 'POST') {
    const fileName = req.headers['x-file-name'] || `stream_upload_${Date.now()}.bin`;
    const savePath = path.join(UPLOAD_DIR, fileName);

    const writeStream = fs.createWriteStream(savePath);
    let bytesReceived = 0;

    req.on('data', (chunk) => {
      bytesReceived += chunk.length;
    });

    req.pipe(writeStream);

    writeStream.on('finish', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'success',
        message: 'File streamed and written to disk successfully',
        file: {
          fileName: fileName,
          savedPath: savePath,
          bytesReceived: bytesReceived
        }
      }));
    });

    writeStream.on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Failed to write file stream to disk',
        details: err.message
      }));
    });

    req.on('error', (err) => {
      writeStream.destroy();
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Request stream encountered an error',
        details: err.message
      }));
    });

    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Route not found' }));
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`[Stream Server] Listening on http://127.0.0.1:${PORT}`);
});