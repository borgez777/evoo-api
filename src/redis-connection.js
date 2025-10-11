import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connectionOptions = {
  host: new URL(process.env.REDIS_URL).hostname,
  port: new URL(process.env.REDIS_URL).port,
  username: new URL(process.env.REDIS_URL).username,
  password: new URL(process.env.REDIS_URL).password,
  maxRetriesPerRequest: null // Essencial para o BullMQ
};

if (process.env.NODE_ENV !== 'production') {
  connectionOptions.tls = {
    rejectUnauthorized: false
  };
}

export const redisConnection = new Redis(connectionOptions);

redisConnection.on('connect', () => console.log('🔌 Conectado ao Redis com sucesso!'));
redisConnection.on('error', (err) => console.error('❌ Erro de conexão com o Redis:', err));