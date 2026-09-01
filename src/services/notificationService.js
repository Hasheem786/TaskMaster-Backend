const Notification = require('../models/Notification');

// Map of userId -> Set of SSE Response objects
const sseClients = new Map();
// Map of userId -> Set of WebSocket objects
const wsClients = new Map();

const addSseClient = (userId, res) => {
  if (!sseClients.has(userId)) {
    sseClients.set(userId, new Set());
  }
  sseClients.get(userId).add(res);

  res.on('close', () => {
    const clients = sseClients.get(userId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) sseClients.delete(userId);
    }
  });
};

const addWsClient = (userId, ws) => {
  if (!wsClients.has(userId)) {
    wsClients.set(userId, new Set());
  }
  wsClients.get(userId).add(ws);

  ws.on('close', () => {
    const clients = wsClients.get(userId);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) wsClients.delete(userId);
    }
  });
};

const notifyUser = async ({ userId, title, message, type = 'INFO' }) => {
  try {
    // Save to DB
    const notification = await Notification.create({ userId, title, message, type });

    const payload = JSON.stringify(notification);

    // Dispatch via SSE
    if (sseClients.has(userId)) {
      for (const res of sseClients.get(userId)) {
        res.write(`data: ${payload}\n\n`);
      }
    }

    // Dispatch via WebSocket
    if (wsClients.has(userId)) {
      for (const ws of wsClients.get(userId)) {
        if (ws.readyState === 1) { // OPEN
          ws.send(payload);
        }
      }
    }

    return notification;
  } catch (error) {
    console.error(`Failed to send notification to user ${userId}:`, error);
  }
};

module.exports = {
  addSseClient,
  addWsClient,
  notifyUser
};
