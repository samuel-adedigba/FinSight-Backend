
// // /server.js
// import "dotenv-flow/config"; 
// import config from "./config/index.js";

// import app from "./app.js";
// import { PrismaClient } from "@prisma/client";

// export const prisma = new PrismaClient({
//   datasources: { db: { url: config.dbUrl } }
// });


// async function startServer() {
//   try {
//     if (!config.dbUrl) {
//       throw new Error("DATABASE_URL is not set in environment");
//     }

//     await prisma.$connect();
//     console.log("✅ Connected to PostgreSQL via Prisma!");
//   } catch (error) {
//     console.error("❌ Prisma connection error:", error);
//     process.exit(1);
//   }

//   app.listen(config.port, () => {
//     console.log(`🚀 Server listening on port ${config.port}`);
//   });
// }

// startServer();


// server.js
// import config from './config/index.js';
// import app from './app.js';
// import { prisma } from './db/prisma.js';
// import redis from './db/redis.js';
// import { initRedisSubscriber } from './messaging/redisSubscriber.js';

// async function startServer() {
//   try {
//     await prisma.$connect();
//     console.log('✅ Postgres connected');

//     await redis.ping();
//     console.log('✅ Redis connected');

//     initRedisSubscriber();

//     app.listen(config.port, () =>
//       console.log(`🚀 Server listening on port ${config.port}`)
//     );
//   } catch (err) {
//     console.error('❌ Startup error:', err);
//     process.exit(1);
//   }
// }

// startServer();


// server.js
import http from 'http';
import config from './config/index.js';
import app from './app.js';
import { prisma } from './db/prisma.js';
import redis from './db/redis.js';
import { initRedisSubscriber } from './messaging/redisSubscriber.js';
import { Server } from 'socket.io';

// Create HTTP server to attach Socket.IO
const httpServer = http.createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Handle client connections and room joins
io.on('connection', (socket) => {
  console.log('📡 Client connected', socket.id);
  socket.on('join', (room) => {
    console.log(`🔑 Client ${socket.id} joined room:`, room);
    socket.join(room);
  });
});

app.set('io', io);

async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Postgres connected');

    await redis.ping();
    console.log('✅ Redis connected');

    initRedisSubscriber(io);

    // app.listen(config.port, () =>
    //   console.log(`🚀 Server listening on port ${config.port}`)
    // );
    httpServer.listen(config.port, () =>
      console.log(`🚀 Server listening on port ${config.port}`)
    );
  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
}

startServer();
