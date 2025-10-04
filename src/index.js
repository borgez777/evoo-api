import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createUser, getUserByApiKey, logEmail, getEmailCount, getEmailHistory } from './database.js';
import { emailQueue } from './queue.js'; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Middleware pra validar API Key 
const validateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API Key não fornecida' });
  }
  
  const user = getUserByApiKey(apiKey);
  
  if (!user) {
    return res.status(401).json({ error: 'API Key inválida' });
  }
  
  req.user = user;
  next();
};

// Rate limiting 
const checkRateLimit = (req, res, next) => {
  const count = getEmailCount(req.user.id, 24);
  const limit = 100;
  
  if (count >= limit) {
    return res.status(429).json({ 
      error: `Limite diário atingido (${limit} emails/24h)` 
    });
  }
  
  next();
};

app.get('/', (req, res) => {
  res.json({ message: 'Evoo API v1.0' });
});

// Endpoint de Cadastro 
app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    const { userId, apiKey } = createUser(email, password);
    
    res.json({ 
      success: true,
      message: 'Usuário criado com sucesso!',
      userId,
      apiKey
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Endpoint de Histórico 
app.get('/history', validateApiKey, (req, res) => {
  const history = getEmailHistory(req.user.id);
  const count = getEmailCount(req.user.id, 24);
  
  res.json({
    emails_sent_last_24h: count,
    daily_limit: 100,
    history
  });
});

// Endpoint de Enviar Email 
app.post('/send-email', validateApiKey, checkRateLimit, async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    
    if (!to || !subject || !message) {
      return res.status(400).json({ error: 'to, subject e message são obrigatórios' });
    }
    
    // Prepara os dados para o job que será processado pelo worker
    const jobData = {
      to,
      subject,
      message,
      userId: req.user.id
    };

    // Adiciona o trabalho (job) à fila em vez de enviar o email diretamente
    await emailQueue.add('sendEmailJob', jobData);
    
    // Registra o email no log para o rate limiting funcionar corretamente
    logEmail(req.user.id, to, subject);

    res.status(202).json({ 
      success: true, 
      message: 'Email enfileirado para envio!',
    });
      
  } catch (error) {
    console.error('Erro ao enfileirar email:', error);
    res.status(500).json({ error: 'Falha ao enfileirar email' });
  }
});

app.listen(PORT, () => {
  console.log(`Evoo API rodando na porta ${PORT}`);
});