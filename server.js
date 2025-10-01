const http = require('http');

const args = process.argv.slice(2);
const getArgValue = (flag, defaultValue) => {
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return defaultValue;
};

const hostname = getArgValue('--hostname', process.env.HOST || '127.0.0.1');
const port = parseInt(getArgValue('--port', process.env.PORT || '3000'), 10);

const server = http.createServer((_req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end('<!DOCTYPE html><html><head><title>Strong Web</title></head><body><h1>Strong Web</h1><p>Minimal placeholder server for Playwright tests.</p></body></html>');
});

const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}`);
});
