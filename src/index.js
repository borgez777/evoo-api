import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createUser, getUserByApiKey, logEmail, getEmailCount, getEmailHistory } from './database.js';

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

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Evoo API v1.0' });
});

// Cadastro
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

// Histórico
app.get('/history', validateApiKey, (req, res) => {
  const history = getEmailHistory(req.user.id);
  const count = getEmailCount(req.user.id, 24);
  
  res.json({
    emails_sent_last_24h: count,
    daily_limit: 100,
    history
  });
});

// Enviar email (com rate limiting)
app.post('/send-email', validateApiKey, checkRateLimit, async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    
    if (!to || !subject || !message) {
      return res.status(400).json({ error: 'to, subject e message são obrigatórios' });
    }
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: message
    });
    
    logEmail(req.user.id, to, subject);
    
    res.json({ 
      success: true, 
      message: 'Email enviado!',
      id: Date.now()
    });
  } catch (error) {
    res.status(500).json({ error: 'Falha ao enviar email' });
  }
});

app.listen(PORT, () => {
  console.log(`Evoo API rodando na porta ${PORT}`);
});