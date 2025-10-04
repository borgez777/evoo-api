import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { emailQueue } from './queue.js'; 

dotenv.config();

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

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const worker = new Worker(emailQueue.name, async job => {
    console.log(`Processando job #${job.id} do tipo ${job.name}...`);
    
    const { to, subject, message } = job.data;
    
    try {
        await transporter.sendMail({
            from: `"Evoo API" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text: message
        });
        console.log(`✅ Email para ${to} enviado com sucesso!`);
    } catch (error) {
        console.error(`❌ Falha ao enviar email para ${to}:`, error);
        throw error;
    }
}, { connection: connectionOptions }); 

console.log('🚀 Worker de email iniciado e ouvindo a fila...');

worker.on('completed', job => {
    console.log(`🎉 Job #${job.id} concluído com sucesso!`);
});

worker.on('failed', (job, err) => {
    console.log(`🔥 Job #${job.id} falhou com o erro: ${err.message}`);
});