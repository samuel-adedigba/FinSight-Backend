// config/index.js
import "dotenv-flow/config"; // loads .env, .env.development, etc.
const requiredEnvs = [
  "DATABASE_URL",
  "JWT_SECRET",
  "REDIS_URL",
  "NODE_ENV",
  "PORT",
];
requiredEnvs.forEach((name) => {
  if (!process.env[name]) throw new Error(`Missing ${name}`);
});
export default {
  port: Number(process.env.PORT) || 5000,
  env: process.env.NODE_ENV,
  dbUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  redisUrl: process.env.REDIS_URL,
  // kafkaBroker: process.env.KAFKA_BROKER,
  //externalWebhookUrl: process.env.EXTERNAL_WEBHOOK_URL,
  // webhookSecret:     process.env.WEBHOOK_SECRET,
  //   geminiApiKey:     process.env.GEMINI_API_KEY,
  //  geminiModel: process.env.GEMINI_MODEL || 'models/gemini-1.5-pro',
  //openaiApiKey: process.env.OPENAI_API_KEY,
  //model:"gpt-3.5-turbo",
};
