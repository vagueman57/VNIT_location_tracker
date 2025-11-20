const Redis = require("ioredis");

let redisClient;

try {
  const redisURL = process.env.REDIS_URL || "redis://localhost:6379";

  redisClient = new Redis(redisURL, {
    tls: redisURL.startsWith("rediss://") ? {} : undefined,
    retryStrategy(times) {
      return Math.min(times * 2000, 10000);
    }
  });

  redisClient.on("connect", () => {
    console.log("🔴 Redis Connected");
  });

  redisClient.on("error", (err) => {
    console.error("Redis Error ➜", err);
  });

} catch (error) {
  console.error("❌ Redis initialization failed:", error);
}

module.exports = redisClient;
