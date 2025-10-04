import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { emailQueue } from './queue.js'; // A gente só precisa da instância para pegar o nome e a conexão

dotenv.config();

// Recria a string de conexão a partir das variáveis de ambiente para o worker
const connection = {
  host: new URL(process.env.REDIS_URL).hostname,
  port: new URL(process.env.REDIS_URL).port,
  username: new URL(process.env.REDIS_URL).username,
  password: new URL(process.env.REDIS_URL).password,

  tls: { rejectUnauthorized: false }
};


// Configuração do Nodemailer (a mesma que você tinha no index.js)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Criando o Worker
const worker = new Worker(emailQueue.name, async job => {
    console.log(`Processando job #${job.id} do tipo ${job.name}...`);
    
    // Os dados que passamos no .add() estão em job.data
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
        // Lançar o erro faz com que a BullMQ saiba que o job falhou
        // e ela pode tentar novamente mais tarde, se configurada para isso.
        throw error;
    }
}, { connection });

console.log('🚀 Worker de email iniciado e ouvindo a fila...');

worker.on('completed', job => {
    console.log(`🎉 Job #${job.id} concluído com sucesso!`);
});

worker.on('failed', (job, err) => {
    console.log(`🔥 Job #${job.id} falhou com o erro: ${err.message}`);
});