const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();
let port = 8080;

// Function to start server
function startServer(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port)
      .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} is busy, trying ${port + 1}...`);
          server.close();
          resolve(startServer(port + 1));
        } else {
          reject(err);
        }
      })
      .on('listening', () => {
        console.log(`Server running at http://localhost:${port}`);
        resolve(server);
      });
  });
}

// Serve static files
app.use(express.static(__dirname));

// Start server and create WebSocket server
startServer(port).then(server => {
  const wss = new WebSocket.Server({ server });

  // Store active connections by channel
  const channels = new Map();

  // Broadcast to all clients in a channel
  function broadcast(channelName, message, sender) {
    if (channels.has(channelName)) {
      const clients = channels.get(channelName);
      clients.forEach(client => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
          try {
            client.send(JSON.stringify(message));
          } catch (error) {
            console.error(`Error broadcasting to client in channel ${channelName}:`, error);
          }
        }
      });
    }
  }

  // Handle WebSocket connection
  wss.on('connection', (ws, req) => {
    const channelName = req.url.slice(1);
    console.log(`New connection request to channel: ${channelName}`);

    // Add to channel
    if (!channels.has(channelName)) {
      channels.set(channelName, new Set());
    }
    channels.get(channelName).add(ws);

    // Send connection confirmation
    try {
      ws.send(JSON.stringify({
        type: 'system',
        content: `Connected to channel: ${channelName}`,
        timestamp: new Date().toISOString(),
        activeConnections: channels.get(channelName).size
      }));

      // Broadcast join message
      broadcast(channelName, {
        type: 'system',
        content: 'New client joined the channel',
        timestamp: new Date().toISOString(),
        activeConnections: channels.get(channelName).size
      }, ws);
    } catch (error) {
      console.error(`Error sending connection confirmation to channel ${channelName}:`, error);
    }

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log(`Received message in channel ${channelName}:`, message);

        // Add server timestamp and metadata
        const enhancedMessage = {
          ...message,
          serverTimestamp: new Date().toISOString(),
          activeConnections: channels.get(channelName).size
        };

        // Broadcast to other clients
        broadcast(channelName, enhancedMessage, ws);
      } catch (error) {
        console.error(`Error handling message in channel ${channelName}:`, error);
        ws.send(JSON.stringify({
          type: 'error',
          content: 'Failed to process message',
          error: error.message
        }));
      }
    });

    // Handle client errors
    ws.on('error', (error) => {
      console.error(`WebSocket error in channel ${channelName}:`, error);
    });

    // Handle disconnection
    ws.on('close', () => {
      if (channels.has(channelName)) {
        channels.get(channelName).delete(ws);

        // Remove channel if empty
        if (channels.get(channelName).size === 0) {
          channels.delete(channelName);
        } else {
          // Broadcast disconnect message
          broadcast(channelName, {
            type: 'system',
            content: 'A client disconnected',
            timestamp: new Date().toISOString(),
            activeConnections: channels.get(channelName).size
          }, ws);
        }
      }
      console.log(`Client disconnected from channel: ${channelName}`);
    });
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
