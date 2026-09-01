const http = require('http');
const { WebSocketServer } = require('ws');
const app = require('./app');
const env = require('./config/env');
const { initDatabase } = require('./config/database');
const { addWsClient } = require('./services/notificationService');
const { verifyToken } = require('./utils/jwt');
const User = require('./models/User');

const server = http.createServer(app);

// Initialize WebSocket Server for Real-Time Push Notifications
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', async (ws, req) => {
  try {
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const token = urlParams.get('token');

    if (!token) {
      ws.close(4001, 'Unauthorized: Missing token');
      return;
    }

    const decoded = await verifyToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      ws.close(4001, 'Unauthorized: Invalid user');
      return;
    }

    addWsClient(user.id, ws);
    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Connected to TaskMaster WebSocket notification stream' }));
  } catch (err) {
    ws.close(4001, 'Unauthorized: Invalid token');
  }
});

// Initialize database and start HTTP server
const startServer = async () => {
  try {
    await initDatabase();
    server.listen(env.PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 TaskMaster Server listening on port ${env.PORT}`);
      console.log(`📡 Environment: ${env.NODE_ENV}`);
      console.log(`⚡ Real-time SSE Endpoint: http://localhost:${env.PORT}/api/notifications/stream`);
      console.log(`🔌 WebSocket Endpoint: ws://localhost:${env.PORT}/ws`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start TaskMaster server:', error);
    process.exit(1);
  }
};

startServer();
