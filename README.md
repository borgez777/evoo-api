# Evoo API 🚀

API de notificação unificada focada no mercado brasileiro, projetada para simplificar o envio de mensagens através de múltiplos canais como Email, WhatsApp e SMS com uma única integração.

Este projeto está sendo construído e documentado publicamente.

## ✨ Features (Funcionalidades)

- **✅ API Unificada:** Integre uma vez, envie para múltiplos canais.
- **📧 Suporte a Email:** Primeiro canal implementado e funcional.
- **🔑 Autenticação Segura:** Sistema de API Key por usuário para proteger os endpoints.
- **📈 Rate Limiting:** Controle de uso (100 emails/24h) para garantir a estabilidade do serviço.
- **⚡ Arquitetura Escalável:** Baseada em Fila (Queue) com Redis e Worker para processamento assíncrono, garantindo respostas rápidas e alta performance para envios em massa.

## 🛠️ Tech Stack (Tecnologias Utilizadas)

- **Backend:** Node.js, Express.js
- **Banco de Dados:** better-sqlite3 (Desenvolvimento)
- **Fila de Tarefas:** Redis, BullMQ
- **Envio de Email:** Nodemailer
- **Hospedagem:** Render

## Começando

Siga os passos abaixo para configurar e rodar o projeto localmente.

### Pré-requisitos

- [Node.js](https://nodejs.org/en/) (versão 18 ou superior)
- [Git](https://git-scm.com/)
- Um cliente de API como o [Postman](https://www.postman.com/)

### Instalação

1.  Clone o repositório:
    ```bash
    git clone [https://github.com/borgez777/evoo-api.git](https://github.com/borgez777/evoo-api.git)
    ```
2.  Navegue até a pasta do projeto:
    ```bash
    cd evoo-api
    ```
3.  Instale as dependências:
    ```bash
    npm install
    ```

### Configuração

1.  Crie um arquivo chamado `.env` na raiz do projeto.
2.  Adicione as seguintes variáveis de ambiente, substituindo com seus próprios valores:
    ```env
    PORT=3000
    EMAIL_USER=seu_email_gmail@gmail.com
    EMAIL_PASS=sua_senha_de_app_do_google
    REDIS_URL=sua_url_de_conexao_externa_do_redis
    ```

### Rodando a Aplicação

Para rodar a aplicação completa, você precisa de **dois terminais** abertos na pasta do projeto.

1.  **Terminal 1 (Inicia o servidor da API):**
    ```bash
    npm run dev
    ```
2.  **Terminal 2 (Inicia o Worker que processa a fila):**
    ```bash
    node src/worker.js
    ```
A API estará disponível em `http://localhost:3000`.

## 📚 Documentação da API

URL Base (Local): `http://localhost:3000`
URL Base (Produção): `https://evoo-api.onrender.com`

### Autenticação

Todas as rotas protegidas requerem um header `x-api-key` com a sua chave de API.

---

### `POST /signup`

Cria um novo usuário e retorna uma API Key para ser usada nas outras chamadas.

- **Body (Corpo):**
  ```json
  {
    "email": "teste@exemplo.com",
    "password": "senha123"
  }
  ```
- **Success Response (Resposta de Sucesso - 200 OK):**
  ```json
  {
    "success": true,
    "message": "Usuário criado com sucesso!",
    "userId": "1026a87c-3b48-4d00-a80c-517f80fc27c9",
    "apiKey": "ac919fb2-48c3-48cc-bf7d-bf7ed60289d4"
  }
  ```

---

### `POST /send-email`

Enfileira um email para ser enviado de forma assíncrona. **Requer autenticação.**

- **Headers (Cabeçalhos):**
  - `x-api-key`: `sua-api-key-aqui`
  - `Content-Type`: `application/json`
- **Body (Corpo):**
  ```json
  {
    "to": "destinatario@exemplo.com",
    "subject": "Assunto do Email",
    "message": "Corpo da sua mensagem."
  }
  ```
- **Success Response (Resposta de Sucesso - 202 Accepted):**
  ```json
  {
    "success": true,
    "message": "Email enfileirado para envio"
  }
  ```
---

### `GET /history`

Retorna o histórico de envios e o limite de uso do usuário. **Requer autenticação.**

- **Headers (Cabeçalhos):**
  - `x-api-key`: `sua-api-key-aqui`
- **Success Response (Resposta de Sucesso - 200 OK):**
  ```json
  {
    "emails_sent_last_24h": 5,
    "daily_limit": 100,
    "history": [
        {
            "to_email": "destinatario@exemplo.com",
            "subject": "Assunto do Email",
            "sent_at": "2025-10-03 18:55:25"
        }
    ]
  }
  ```
---
Feito por **Daniel Borges**.
