import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL, {
  tls: {
    rejectUnauthorized: false,
  },
  maxRetriesPerRequest: 0,       // avoids crash on retry
  enableAutoPipelining: true,
});

redis.on("connect", () => console.log("⚡ Redis Connected"));
redis.on("error", (err) => console.error("Redis Error ➜", err));

export default redis;
