import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { Redis } from "ioredis";
import "dotenv/config";

const app = express();
app.use(cors());

// normal redis will be there for normal actions interactions like if we wannted to increment a field
// in hash, add an item to a set.
// subRedis will open a percistent connection via TCP to a redis instance and it is gonna stay open
// because if we open a client for a subscription then it will stay open and we won't be able to use
// it for anything else.
const redis = new Redis(process.env.REDIS_CONNECTION_STRING);
const subRedis = new Redis(process.env.REDIS_CONNECTION_STRING);

const server = http.createServer(app);
const PORT = process.env.PORT || 8080;
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

subRedis.on("message", (channel, message) => {
  // console.log(`Received message in room ${channel}: ${message}`);
  io.to(channel).emit("room-update", message);
});

subRedis.on("error", (err) => {
  console.error("Error in subscription", err);
});

io.on("connection", async (socket) => {
  const { id } = socket;
  socket.on("join-room", async (roomId: string) => {
    console.log(`User ${id} joined room ${roomId}`);

    const subscribedRooms = await redis.smembers("subscribed-rooms");
    await socket.join(roomId);
    await redis.sadd(`rooms:${id}`, roomId);
    await redis.hincrby("room-connections", roomId, 1);

    if (!subscribedRooms.includes(roomId)) {
      await subRedis.subscribe(roomId, async (err) => {
        if (err) {
          console.error("Failed to subscribe:", err);
        } else {
          await redis.sadd("subscribed-rooms", roomId);
          console.log("Subscribed to room: ", roomId);
        }
      });
    }
  });

  socket.on("disconnect", async () => {
    const { id } = socket;

    const joinedRooms = await redis.smembers(`rooms:${id}`);
    await redis.del(`rooms:${id}`);

    joinedRooms.forEach(async (roomId) => {
      const remainingConnections = await redis.hincrby(
        `room-connections`,
        roomId,
        -1
      );

      if (remainingConnections <= 0) {
        await redis.hdel(`room-connections`, roomId);

        await subRedis.unsubscribe(roomId, async (err) => {
          if (err) {
            console.error("Failed to unsubscribe", err);
          } else {
            await redis.srem("subscribed-rooms", roomId);
            console.log("Unsubscribed from room: ", roomId);
          }
        });
      }
    });
  });
});
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
