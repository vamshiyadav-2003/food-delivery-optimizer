const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'frontend');

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    const cleanUrl = req.url.split('?')[0];
    let filePath = path.join(PUBLIC_DIR, cleanUrl === '/' ? 'index.html' : cleanUrl);
    
    // Safety check to prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.statusCode = 403;
        res.end('Access Denied');
        return;
    }

    const ext = path.extname(filePath);
    let contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'text/plain');
                res.end('404 Not Found');
            } else {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('500 Internal Server Error');
            }
        } else {
            res.statusCode = 200;
            res.setHeader('Content-Type', contentType);
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Quick Bite Food Delivery Optimizer Server is Running!`);
    console.log(`🔗 Local Address: http://localhost:${PORT}`);
    console.log(`👉 Open http://localhost:${PORT} in your browser to present.`);
    console.log(`=======================================================`);
});
