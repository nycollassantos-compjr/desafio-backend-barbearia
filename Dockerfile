FROM node:20-alpine

# 1. Instala o OpenSSL exigido pelo Prisma no Alpine
RUN apk add --no-cache openssl

WORKDIR /usr/src/app

# Copia dependências e pasta do Prisma primeiro
COPY package*.json ./
COPY prisma ./prisma/

# Instala as dependências (já gera o Prisma Client automaticamente)
RUN npm install

# 2. Gera os binários do Prisma para a plataforma do container
RUN npx prisma generate

# Copia o restante do código
COPY . .

EXPOSE 3001

# Para que o banco crie as tabelas automaticamente
CMD ["sh", "-c", "npx prisma db push && npm run dev"]