import { Queue } from 'bullmq';
import { redisConnection } from './redis-connection.js'; // Importa a conexão

export const emailQueue = new Queue('emailQueue', { connection: redisConnection });

export const whatsappQueue = new Queue('whatsappQueue', { connection: redisConnection });