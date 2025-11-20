const Redis = require("ioredis");

const redisClient = new Redis(process.env.REDIS_URL, {
  tls: process.env.REDIS_URL.includes("rediss://") ? {} : undefined,
  retryStrategy: () => 2000,
});

redisClient.on("connect", () => console.log("🔴 Redis Connected"));
redisClient.on("error", (err) => console.error("Redis Error ➜", err));

module.exports = redisClient;
