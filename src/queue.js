import { Queue } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

// O nome da fila. Pode ser qualquer string.
const QUEUE_NAME = 'emailQueue';

// Conexão com o Redis
const connection = {
  host: new URL(process.env.REDIS_URL).hostname,
  port: new URL(process.env.REDIS_URL).port,
  username: new URL(process.env.REDIS_URL).username,
  password: new URL(process.env.REDIS_URL).password,

  tls: { rejectUnauthorized: false }
};

// Exportamos a instância da fila para ser usada em outros lugares
export const emailQueue = new Queue(QUEUE_NAME, { connection });