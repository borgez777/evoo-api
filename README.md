# Evoo API 🚀

Esta é uma API de notificação unificada que eu criei do zero, com foco no mercado brasileiro. Meu objetivo é simplificar o envio de mensagens através de múltiplos canais como Email, WhatsApp e SMS, permitindo que desenvolvedores e pequenos negócios integrem tudo em um só lugar.

Este projeto está sendo construído e documentado publicamente como parte da minha jornada de desenvolvimento.

## ✨ Features (Funcionalidades)

- **✅ API Unificada:** Integre uma vez, envie para múltiplos canais.
- **📧 Suporte a Email:** Primeiro canal implementado e funcional.
- **🔑 Autenticação Segura:** Sistema de API Key por usuário para proteger os endpoints.
- **📈 Rate Limiting:** Controle de uso (100 emails/24h) para garantir a estabilidade do serviço.
- **⚡ Arquitetura Escalável:** Baseada em Fila (Queue) com Redis e Worker para processamento assíncrono, garantindo respostas rápidas e alta performance para envios em massa.

## 🛠️ Tech Stack (Tecnologias Utilizadas)

- **Backend:** Node.js, Express.js
- **Banco de Dados (Dev):** better-sqlite3
- **Fila de Tarefas:** Redis, BullMQ
- **Envio de Email:** Google Apps Script (atuando como um proxy para o Gmail)
- **Gerenciador de Processos:** Concurrently
- **Hospedagem:** Render

## 🏁 Começando (Guia para Desenvolvedores)

Siga os passos abaixo para configurar e rodar o projeto localmente na sua máquina.

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
    REDIS_URL=sua_url_de_conexao_externa_do_redis
    APPS_SCRIPT_URL=a_url_do_seu_app_da_web_criado_no_google
    ```

### Rodando a Aplicação

Para rodar a aplicação completa (API e Worker), basta um único comando graças ao Concurrently:

```bash
npm run dev
```
Isso iniciará ambos os processos. A API estará disponível em `http://localhost:3000`.

## 📚 Documentação da API

**URL Base (Produção):** `https://evoo-api.onrender.com`

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
    "userId": "...",
    "apiKey": "..."
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
            "to_email": "...",
            "subject": "...",
            "sent_at": "..."
        }
    ]
  }
  ```
---
Feito por [Daniel Borges](https://github.com/borgez777).
