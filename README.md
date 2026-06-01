# ChatIA - Sistema Multi-tenant de Atendimento WhatsApp

> **Versão:** 2.2.2v-26
> **Última Atualização:** 07/03/2026

Sistema SaaS multi-tenant de atendimento via WhatsApp com suporte a múltiplas empresas, filas de atendimento, chatbots e mensagens agendadas.

---

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Setup Inicial (Primeira Vez)](#setup-inicial-primeira-vez)
3. [Desenvolvimento (Dia a Dia)](#desenvolvimento-dia-a-dia)
4. [Credenciais Padrão](#credenciais-padrão)
5. [Portas Utilizadas](#portas-utilizadas)
6. [Arquitetura](#arquitetura)
7. [Scripts Disponíveis](#scripts-disponíveis)
8. [Solução de Problemas](#solução-de-problemas)

---

## Pré-requisitos

- **Node.js** 24.12.0 ou superior
- **Docker** e **Docker Compose**
- **npm** 10.x ou superior
- **Git**

**Verificar instalação:**
```bash
node --version    # Deve retornar v24.12.0 ou superior
docker --version  # Deve retornar Docker version 20.x ou superior
npm --version     # Deve retornar 10.x ou superior
```

---

## Setup Inicial (Primeira Vez)

### Passo 1: Clonar Repositório

```bash
git clone <repository-url>
cd chatia-4.1.0-main
```

### Passo 2: Configurar Variáveis de Ambiente

#### Backend
```bash
cd backend
cp .env.example .env
# Editar .env conforme necessário
cd ..
```

**Variáveis críticas do backend (.env):**
```env
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5434
DB_NAME=chatia_dev
DB_USER=chatia
DB_PASS=chatia123dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380

# JWT
JWT_SECRET=dev_jwt_secret_change_in_production_12345678
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_change_in_production_12345678
```

#### Frontend
```bash
cd frontend
cp .env.example .env
# Editar .env conforme necessário
cd ..
```

**Variáveis do frontend (.env):**
```env
REACT_APP_BACKEND_URL=http://localhost:3001
PORT=3000
```

### Passo 3: Subir Containers Docker

```bash
docker-compose up -d
```

**Containers criados:**
- `chatia_postgres_dev` (PostgreSQL 15) - Porta 5434
- `chatia_redis_dev` (Redis 7) - Porta 6380

### Passo 4: Executar Setup Automatizado

```bash
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh
```

**O script irá:**
1. Verificar Docker
2. Aguardar PostgreSQL ficar pronto
3. Criar database `chatia_dev` (se não existir)
4. Compilar backend (TypeScript → JavaScript)
5. Executar migrations (263 migrações)
6. Executar seeders (6 seeders, incluindo super admin)
7. Verificar criação do usuário super admin

**Tempo estimado:** 3-5 minutos

### Passo 5: Instalar Dependências

#### Backend
```bash
cd backend
npm install
cd ..
```

**Tempo estimado:** 2-3 minutos

#### Frontend
```bash
cd frontend
npm install --legacy-peer-deps
cd ..
```

**Tempo estimado:** 20-30 minutos (WSL) ou 5-10 minutos (Linux/macOS)

**⚠️ IMPORTANTE:** Use `--legacy-peer-deps` devido a conflitos entre Material-UI v4 e v5.

### Passo 6: Validar Build do Backend

```bash
chmod +x scripts/validate-build.sh
./scripts/validate-build.sh
```

**Deve retornar:**
```
✅ Build validation passed!
ℹ️  Build info:
   Location: backend/dist
   Migrations: 263 files
```

---

## Desenvolvimento (Dia a Dia)

### Iniciar Serviços

**Opção 1: Usando script automatizado**
```bash
./start-dev.sh
```

**Opção 2: Manualmente (2 terminais separados)**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
cd frontend
BROWSER=none npm start
```

**⚠️ Primeira compilação do frontend:** 5-10 minutos (WSL) ou 2-3 minutos (Linux/macOS)

### Acessar Sistema

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Socket.IO Admin:** http://localhost:3001/admin

---

## Credenciais Padrão

### Super Admin
```
Email:    admin@admin.com
Senha:    123456
Perfil:   admin
Super:    true
```

**⚠️ IMPORTANTE:** Sempre usar `admin@admin.com` (não `admin@chatia.local`)

### Empresa Padrão
```
ID:   1
Nome: Empresa 1
```

---

## Portas Utilizadas

| Serviço        | Porta | URL                     |
|----------------|-------|-------------------------|
| Frontend       | 3000  | http://localhost:3000   |
| Backend        | 3001  | http://localhost:3001   |
| PostgreSQL     | 5434  | localhost:5434          |
| Redis          | 6380  | localhost:6380          |

**⚠️ Evitar portas 5173, 8080, 5050** (conflito com outros sistemas)

---

## Arquitetura

### Stack Tecnológico

#### Backend
- **Node.js** 24.12.0
- **TypeScript** 4.2.4
- **Express** 4.17.3
- **Sequelize** 5.22.3 (ORM)
- **PostgreSQL** 15
- **Redis** 7
- **Socket.IO** 4.7.4
- **@whiskeysockets/baileys** (WhatsApp)
- **Bull** 3.11.0 (Job Queue)

#### Frontend
- **React** 17.0.2
- **Material-UI v4** 4.12.3
- **Material-UI v5** 5.17.1 (em transição)
- **Socket.IO Client** 4.7.4
- **Axios** 1.6.8
- **React Router** 5.2.0

### Estrutura de Diretórios

```
chatia-4.1.0-main/
├── backend/
│   ├── src/                    # Código TypeScript
│   │   ├── server.ts          # Entry point
│   │   ├── app.ts             # Express config
│   │   ├── routes/            # API endpoints
│   │   ├── controllers/       # Business logic
│   │   ├── services/          # Service layer
│   │   ├── models/            # Sequelize models
│   │   ├── database/
│   │   │   ├── migrations/    # 263 migrations
│   │   │   └── seeds/         # 6 seeders
│   │   └── libs/              # Socket.IO, WhatsApp, Queue
│   ├── dist/                  # Código compilado (JS)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/             # Route components
│   │   ├── components/        # Reusable components
│   │   ├── services/          # API clients
│   │   └── context/           # React Context
│   └── package.json
├── scripts/
│   ├── setup-database.sh      # Setup automatizado
│   └── validate-build.sh      # Validação de build
├── docker-compose.yml         # PostgreSQL + Redis
├── .env                       # Env vars (não commitado)
├── CLAUDE.md                  # Documentação técnica completa
├── AUDIT-DATABASE.md          # Auditoria de banco de dados
└── README.md                  # Este arquivo
```

---

## Scripts Disponíveis

### Backend (`cd backend`)

| Script | Comando | Descrição |
|--------|---------|-----------|
| Compilar | `npm run build` | Compila TypeScript → JavaScript |
| Dev Server | `npm run dev:server` | Inicia servidor em modo desenvolvimento |
| Migrar DB | `npm run db:migrate` | Executa migrations (auto-build incluído) |
| Desfazer Migration | `npm run db:migrate:undo` | Desfaz última migration |
| Seeders | `npm run db:seed` | Executa seeders (auto-build incluído) |
| Desfazer Seeders | `npm run db:seed:undo` | Desfaz todos os seeders |
| Testes | `npm test` | Executa testes (se configurados) |

### Frontend (`cd frontend`)

| Script | Comando | Descrição |
|--------|---------|-----------|
| Dev Server | `npm start` | Inicia servidor em modo desenvolvimento |
| Build Produção | `npm run build` | Gera build otimizado |
| Testes | `npm test` | Executa testes |

### Scripts de Setup (`./scripts/`)

| Script | Descrição |
|--------|-----------|
| `setup-database.sh` | Setup completo: cria DB, migrations, seeders |
| `validate-build.sh` | Valida build do backend |

---

## Solução de Problemas

### 1. Backend não inicia ("Database does not exist")

**Problema:** Banco `chatia_dev` não foi criado.

**Solução:**
```bash
./scripts/setup-database.sh
```

### 2. Migrations falham ("cannot find module")

**Problema:** Backend não foi compilado ou `dist/` está desatualizado.

**Solução:**
```bash
cd backend
rm -rf dist
npm run build
npm run db:migrate
```

### 3. Super admin não existe após seeders

**Problema:** Seeders não executaram corretamente.

**Solução:**
```bash
cd backend
npm run db:seed:undo
npm run db:seed
```

**Verificar:**
```bash
docker exec chatia_postgres_dev psql -U chatia -d chatia_dev -c "SELECT email, super FROM \"Users\" WHERE email='admin@admin.com';"
```

### 4. Frontend não compila ("peer dependency conflict")

**Problema:** Conflito entre Material-UI v4 e v5.

**Solução:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### 5. WhatsApp não conecta

**Problema:** Baileys (biblioteca WhatsApp) é instável.

**Solução:** Reiniciar backend e gerar novo QR Code.

### 6. Redis não conecta

**Problema:** Container Redis não está rodando.

**Solução:**
```bash
docker-compose up -d redis
```

### 7. PostgreSQL não aceita conexões

**Problema:** Container PostgreSQL não está pronto.

**Solução:**
```bash
docker exec chatia_postgres_dev pg_isready -U chatia
# Deve retornar: /var/run/postgresql:5432 - accepting connections
```

### 8. Porta 3001 já está em uso

**Problema:** Outro processo está usando a porta.

**Solução:**
```bash
# Linux/WSL
lsof -i :3001
kill -9 <PID>

# Ou alterar porta no backend/.env
PORT=3002
```

### 9. Build do backend demora muito

**Tempo esperado:** 2-3 minutos (primeira vez)

**Se demorar mais de 5 minutos:**
```bash
cd backend
rm -rf dist node_modules
npm install
npm run build
```

### 10. Logs não aparecem no terminal

**Problema:** Sequelize logging desabilitado.

**Solução temporária:**
```typescript
// backend/src/config/database.ts
logging: console.log  // Mudar de false para console.log
```

---

## Comandos Úteis

### Verificar Status dos Serviços

```bash
# Verificar containers Docker
docker ps

# Verificar processos Node.js
ps aux | grep node

# Ver logs do backend em tempo real
cd backend && npm run dev:server

# Ver logs do PostgreSQL
docker logs chatia_postgres_dev

# Ver logs do Redis
docker logs chatia_redis_dev
```

### Resetar Banco de Dados Completamente

```bash
# ⚠️ ATENÇÃO: Isso apaga TODOS os dados!
docker-compose down -v
docker-compose up -d
./scripts/setup-database.sh
```

### Testar API Manualmente

```bash
# Health check (se implementado)
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"123456"}'
```

### Acessar PostgreSQL Diretamente

```bash
docker exec -it chatia_postgres_dev psql -U chatia -d chatia_dev

# Comandos úteis dentro do psql:
\dt              # Listar todas as tabelas
\d "Users"       # Descrever estrutura da tabela Users
SELECT * FROM "Users";  # Ver todos os usuários
\q               # Sair
```

### Limpar Cache e Reinstalar Dependências

```bash
# Backend
cd backend
rm -rf node_modules dist package-lock.json
npm install
npm run build

# Frontend
cd frontend
rm -rf node_modules build package-lock.json
npm install --legacy-peer-deps
```

---

## Contatos e Suporte

- **Documentação Técnica Completa:** Ver `CLAUDE.md`
- **Auditoria de Banco de Dados:** Ver `AUDIT-DATABASE.md`
- **Plano de Execução Sprint 1 e 2:** Ver `PLAN-SPRINT1-2.md`

---

## Notas Importantes

1. **Sequelize v5:** Sistema usa Sequelize 5.22.3 (deprecated). Migração para v6+ está no backlog.

2. **Material-UI Duplicado:** Projeto tem v4 e v5 simultaneamente. Unificação está no backlog.

3. **TypeScript Strict:** `strict: false` - alguns erros de tipo são ignorados.

4. **Migrations executam de `dist/`:** Sempre rodar `npm run build` antes de migrations manuais.

5. **Timezone:** Hardcoded para `America/Sao_Paulo`. Não alterar sem auditoria completa.

6. **Multi-tenancy:** Todos os modelos têm `companyId`. Sempre filtrar por empresa.

7. **Baileys (WhatsApp):** Biblioteca instável. Conexões podem cair frequentemente.

8. **Bull Queue:** Biblioteca arquivada mas funcional. Migração para BullMQ está no backlog.

---

**Gerado em:** 07/03/2026
**Versão:** 1.0
**Mantenha este arquivo atualizado** conforme o projeto evolui!
