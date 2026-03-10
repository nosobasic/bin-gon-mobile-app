import 'dotenv/config';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectToDatabase } from './infrastructure/database.js';
import { buildApp } from './presentation/http/app.js';
import { getEnv } from './infrastructure/env.js';
import { initializeSocketHandlers } from './presentation/websocket/socket-handlers.js';
import { seedRewardTiers } from './infrastructure/seedRewardTiers.js';

async function start() {
  const env = getEnv();
  await connectToDatabase(env.mongodbUri);
  
  // Seed reward tiers data
  await seedRewardTiers();

  const app = buildApp(env);
  const server = http.createServer(app);

  // Initialize Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: env.corsOrigin,
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Initialize socket handlers
  initializeSocketHandlers(io, env);

  server.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${env.port}`);
    // eslint-disable-next-line no-console
    console.log(`WebSocket server ready for connections`);
  });
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Fatal startup error:', error);
  process.exit(1);
});


