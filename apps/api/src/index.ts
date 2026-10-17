import { createServer } from './server.js';

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const server = createServer();

server.listen(PORT, HOST, () => {
  console.log(`[mdtodocs-api] Headless Agent API running at http://${HOST}:${PORT}`);
  console.log(`[mdtodocs-api] Health check: http://${HOST}:${PORT}/api/v1/health`);
  console.log(`[mdtodocs-api] Endpoints: /api/v1/validate, /api/v1/render, /api/v1/repair`);
});

process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
});
