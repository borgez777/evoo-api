import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import { Worker } from 'bullmq';
import { whatsappQueue } from './queue.js';
import { redisConnection } from './redis-connection.js';

let sock;
let worker;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if(qr) {
            qrcode.generate(qr, { small: true });
            console.log('[WhatsApp Worker] QR Code gerado. Por favor, escaneie para conectar.');
        }
        if(connection === 'close') {
    
            if (worker) {
                worker.close();
            }

            const shouldReconnect = (lastDisconnect.error instanceof Boom) &&
                                     lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
            console.log('[WhatsApp Worker] Conexão fechada. Motivo:', lastDisconnect.error, '. Reconectando:', shouldReconnect);
            
            if(shouldReconnect) {
                connectToWhatsApp();
            }
        } else if(connection === 'open') {
            console.log('🚀 [WhatsApp Worker] Conexão com o WhatsApp aberta com sucesso!');

            startWorker();
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

function startWorker() {
    console.log('🚀 [WhatsApp Worker] Iniciado e ouvindo a fila...');

    worker = new Worker(whatsappQueue.name, async job => {
        const { to, message } = job.data;
        console.log(`[WhatsApp Worker] Processando job #${job.id}: Enviando para ${to}`);

        try {
            let formattedNumber = to.replace(/\D/g, '');
            if (formattedNumber.length === 13 && formattedNumber.startsWith('55') && formattedNumber[4] === '9') {
                formattedNumber = formattedNumber.slice(0, 4) + formattedNumber.slice(5);
            }
            formattedNumber = `${formattedNumber}@s.whatsapp.net`;

            const [result] = await sock.onWhatsApp(formattedNumber);

            if (!result || !result.exists) {
                throw new Error(`Número ${to} (${formattedNumber}) não existe no WhatsApp.`);
            }

            await sock.sendMessage(formattedNumber, { text: message });
            
            console.log(`✅ [WhatsApp Worker] Mensagem para ${to} enviada com sucesso!`);
        } catch (error) {
            console.error(`❌ [WhatsApp Worker] Falha ao enviar para ${to}:`, error);
            throw error;
        }
    }, { connection: redisConnection });

    worker.on('completed', job => {
        console.log(`🎉 [WhatsApp Worker] Job #${job.id} concluído com sucesso!`);
    });

    worker.on('failed', (job, err) => {
        console.log(`🔥 [WhatsApp Worker] Job #${job.id} falhou com o erro: ${err.message}`);
    });
}

// Inicia o processo de conexão
connectToWhatsApp();