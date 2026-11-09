import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
const root = path.resolve(process.argv[2]);
http.createServer(async (req, res) => {
 const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
 let file = path.join(root, pathname);
 let status = 200;
 if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(404); res.end(); return; }
 try { if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html'); await fs.access(file); }
 catch { file = path.join(root, '404.html'); status = 404; }
 const ext = path.extname(file);
 const type = ({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.wasm':'application/wasm'})[ext] || 'application/octet-stream';
 try {const body = gzipSync(await fs.readFile(file)); res.writeHead(status, {'Content-Type':type,'Content-Encoding':'gzip','Content-Length':body.length,'Cache-Control':ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'});res.end(body);} catch {res.writeHead(404);res.end();}
}).listen(Number(process.argv[3] || 4180), '127.0.0.1');
