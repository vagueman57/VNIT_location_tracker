const redis = require("redis");

const client = redis.createClient({
  url: process.env.REDIS_URL   // from Upstash
});

client.on("connect", () => {
  console.log("🔴 Redis Connected");
});

client.on("error", (err) => {
  console.log("Redis Error ➜", err);
});

client.connect();

module.exports = client;
