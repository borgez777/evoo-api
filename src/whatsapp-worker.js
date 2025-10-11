import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import { Worker } from 'bullmq';
import { whatsappQueue } from './queue.js';
import { redisConnection } from './redis-connection.js';

const sessionNames = ['session_1', 'session_2'];
const sockets = new Map(); 
let currentSocketIndex = 0; 

let worker;

async function connectToWhatsApp(sessionName) {
    console.log(`[${sessionName}] Iniciando conexão com o WhatsApp...`);
    const { state, saveCreds } = await useMultiFileAuthState(`auth_${sessionName}`);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });
    
    sockets.set(sessionName, sock);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if(qr) {
            console.log(`[${sessionName}] --- QR CODE PARA A SESSÃO "${sessionName}" ---`);
            qrcode.generate(qr, { small: true });
            console.log(`[${sessionName}] Escaneie o QR Code para conectar esta sessão.`);
        }
        if(connection === 'close') {
            sockets.delete(sessionName); 

            const shouldReconnect = (lastDisconnect.error instanceof Boom) &&
                                     lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
            console.log(`[${sessionName}] Conexão fechada. Motivo:`, lastDisconnect.error, '. Reconectando:', shouldReconnect);
            
            if(shouldReconnect) {
                connectToWhatsApp(sessionName);
            }
        } else if(connection === 'open') {
            console.log(`🚀 [${sessionName}] Conexão com o WhatsApp aberta com sucesso!`);
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

function startWorker() {
    console.log('🚀 [Master Worker] Iniciado e ouvindo a fila de WhatsApp...');

    worker = new Worker(whatsappQueue.name, async job => {
        const { to, message, delay } = job.data;
        
        const activeSessions = Array.from(sockets.keys());
        if (activeSessions.length === 0) {
            throw new Error('Nenhuma sessão de WhatsApp está conectada para enviar a mensagem.');
        }

        const sessionNameToUse = activeSessions[currentSocketIndex];
        const sock = sockets.get(sessionNameToUse);

        currentSocketIndex = (currentSocketIndex + 1) % activeSessions.length;
        // ---------------------------------------

        console.log(`[${sessionNameToUse}] Processando job #${job.id}: Enviando para ${to}`);

        try {
            let formattedNumber = to.replace(/\D/g, '');
            
            formattedNumber = `${formattedNumber}@s.whatsapp.net`;

            const [result] = await sock.onWhatsApp(formattedNumber);
            if (!result || !result.exists) {
                throw new Error(`Número ${to} não existe no WhatsApp.`);
            }

            await sock.sendMessage(formattedNumber, { text: message });
            
            console.log(`✅ [${sessionNameToUse}] Mensagem para ${to} enviada com sucesso!`);

            const delayInMs = (delay || 0) * 1000;
            if (delayInMs > 0) {
                console.log(`[Master Worker] Pausando por ${delay} segundos...`);
                await new Promise(resolve => setTimeout(resolve, delayInMs));
            }
        } catch (error) {
            console.error(`❌ [${sessionNameToUse}] Falha ao enviar para ${to}:`, error);
            throw error;
        }
    }, { connection: redisConnection });

}

async function main() {

    for (const sessionName of sessionNames) {
        await connectToWhatsApp(sessionName);
        
        await new Promise(resolve => setTimeout(resolve, 2000)); 
    }
    
    startWorker();
}

main();