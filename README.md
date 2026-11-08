# ✂️ Barbearia - Sistema de Agendamentos

Sistema de gerenciamento de agendamentos para barbearia, desenvolvido para o **Desafio Back-End Comp Júnior 2026/2**.

---

## 📌 1. Tema e Escopo

O projeto é um sistema de gerenciamento de agendamentos de serviços voltado para barbearias. A aplicação permite que clientes agendem serviços em horários marcados, enquanto administradores gerenciam o catálogo de serviços e a agenda da barbearia.

### Propósito do Sistema

Eliminar conflitos de horários na agenda, oferecer controle detalhado sobre os serviços oferecidos e automatizar o fluxo de marcação de horários para os clientes.

### API Externa: Open-Meteo

No desenvolvimento do sistema foi integrada a **Open-Meteo Weather Forecast API**, uma API pública de dados meteorológicos.

Ao listar os agendamentos (`GET /agendamentos`), a aplicação faz chamadas assíncronas em tempo real e consulta a previsão do tempo para o horário exato do corte (timezone: UTC).

**Utilidade da integração:**

- **Para o cliente:** permite antecipar condições adversas (alta probabilidade de chuva ou temperaturas extremas) no horário do deslocamento até a barbearia.
- **Para a barbearia:** auxilia no gerenciamento de imprevistos ou atrasos causados por tempestades em horários específicos.

---

## 🗄 2. Entidades Principais e Modelagem (DER)

O sistema conta com **3 entidades de negócio**:

1. **`Usuario`**: representa os usuários do sistema, divididos entre os perfis de **Cliente** e **Administrador** (barbeiros/gestores).
2. **`Servico`**: representa os serviços oferecidos (ex.: Corte de Cabelo, Barba, Combo), com preços e durações personalizadas.
3. **`Agendamento`**: entidade central que vincula um cliente a um serviço em uma data e hora específicas.

### Diagrama Entidade-Relacionamento (DER)

```mermaid
erDiagram
    USUARIO ||--o{ AGENDAMENTO : "realiza"
    AGENDAMENTO }o--|| SERVICO : "inclui"

    USUARIO {
        uuid id PK
        string nome
        string email
        string senha_hash
        string telefone
        enum perfil "CLIENTE | ADMIN"
    }

    SERVICO {
        uuid id PK
        string nome
        string descricao
        int duracao_minutos
        decimal preco
        boolean ativo
    }

    AGENDAMENTO {
        uuid id PK
        uuid usuario_id FK
        uuid servico_id FK
        datetime data_hora
        string status "AGENDADO | CONCLUIDO | CANCELADO | INDISPONIVEL"
        string observacoes
    }
```

---

## 🚀 3. Como Executar o Projeto

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose instalados e em execução.

### Execução em ambiente limpo (Docker)

**1. Clonar o repositório**

```bash
git clone https://github.com/nycollassantos-compjr/desafio-backend-barbearia.git
cd desafio-backend-barbearia
```

**2. Configurar as variáveis de ambiente**

Crie um arquivo `.env` na raiz do projeto (se preferir, copie o modelo `.env.example`):

```env
   # Servidor e Banco de Dados
   PORT=3001
   DATABASE_URL="postgresql://postgres:postgrespassword@postgres:5432/barbearia_db?schema=public"
   
   # Autenticação
   JWT_SECRET="sua_chave_secreta_jwt_aqui"
   
   # Configuração do Servidor de E-mail (Mailtrap)
   MAIL_HOST=sandbox.smtp.mailtrap.io
   MAIL_PORT=2525
   MAIL_USER=seu_usuario_mailtrap
   MAIL_PASS=sua_senha_mailtrap
   MAIL_FROM="no-reply@barbearia.com"

**3. Subir os containers (aplicação + banco)**

```bash
docker compose up -d --build
```

> A aplicação sincroniza as tabelas do PostgreSQL automaticamente e fica disponível em **http://localhost:3001**.

**4. Verificar os logs de execução**

```bash
docker compose logs -f app
```

**5. Encerrar e limpar o ambiente**

```bash
docker compose down -v
```

> O parâmetro `-v` também remove o volume do banco, apagando todos os dados.

---

## 📡 4. Coleção de Requisições e Endpoints

A coleção completa de rotas, pronta para importação no Insomnia, está na raiz do repositório: **`Insomnia_Collection.json`**.

**Como importar:** no Insomnia, vá em *Application → Preferences → Data → Import → Import to "nome do projeto".

### Resumo dos Endpoints

| Categoria | Método | Endpoint | Acesso | Descrição |
|---|---|---|---|---|
| Geral | GET | `/health` | Público | Verifica o estado da API |
| Auth | POST | `/auth/registrar` | Público | Cadastro de novo usuário |
| Auth | POST | `/auth/login` | Público | Autenticação e geração do token JWT |
| Auth | POST | `/auth/esqueci-senha` | Público | Solicitação de redefinição de senha |
| Auth | POST | `/auth/redefinir-senha` | Público | Redefinição de senha via token enviado |
| Usuários | GET | `/usuarios` | ADMIN | Listagem de todos os usuários |
| Usuários | PUT | `/usuarios/me` | Autenticado | Atualização dos dados do próprio perfil |
| Usuários | DELETE | `/usuarios/:id` | ADMIN | Remoção de usuário do sistema |
| Serviços | GET | `/servicos` | Autenticado | Listagem de serviços ativos |
| Serviços | POST | `/servicos` | ADMIN | Cadastro de novo serviço |
| Serviços | PUT | `/servicos/:id` | ADMIN | Atualização de dados do serviço |
| Serviços | DELETE | `/servicos/:id` | ADMIN | Remoção/desativação de serviço |
| Agendamentos | POST | `/agendamentos` | Autenticado | Criação de agendamento de horário |
| Agendamentos | GET | `/agendamentos` | Autenticado | Listagem com previsão do tempo (Open-Meteo) |
| Agendamentos | PATCH | `/agendamentos/:id/cancelar` | Autenticado | Cancelamento de agendamento |

### Autenticação

As rotas protegidas exigem o token JWT obtido em `POST /auth/login`:

```
Authorization: Bearer <seu_token>
```
