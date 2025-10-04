import { Queue } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

const QUEUE_NAME = 'emailQueue';

// Conexão com o Redis
const connectionOptions = {
  host: new URL(process.env.REDIS_URL).hostname,
  port: new URL(process.env.REDIS_URL).port,
  username: new URL(process.env.REDIS_URL).username,
  password: new URL(process.env.REDIS_URL).password,
};

if (process.env.NODE_ENV !== 'production') {
  connectionOptions.tls = {
    rejectUnauthorized: false
  };
}

export const emailQueue = new Queue(QUEUE_NAME, { connection: connectionOptions });