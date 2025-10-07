import { Worker } from 'bullmq';
import dotenv from 'dotenv';
import { emailQueue } from './queue.js';

dotenv.config();

// Bloco de conexão com o Redis 
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

const worker = new Worker(emailQueue.name, async job => {
    console.log(`Processando job #${job.id} do tipo ${job.name}...`);
    
    const { to, subject, message } = job.data;
    
    try {
    
        const response = await fetch(process.env.APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        
            redirect: 'follow', 
            body: JSON.stringify({ to, subject, message })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Falha ao chamar a API do Google Apps Script');
        }

        console.log(`✅ Job encaminhado para o Google Apps Script com sucesso! Destino: ${to}`);

    } catch (error) {
        console.error(`❌ Falha ao processar job para ${to}:`, error);
        throw error;
    }
}, { connection: connectionOptions });

console.log('🚀 Worker (usando Google Apps Script) iniciado e ouvindo a fila...');

worker.on('completed', job => {
    console.log(`🎉 Job #${job.id} concluído com sucesso!`);
});

worker.on('failed', (job, err) => {
    console.log(`🔥 Job #${job.id} falhou com o erro: ${err.message}`);
});