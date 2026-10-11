FROM node:20-alpine

WORKDIR /usr/src/app

# Copia dependências e pasta do Prisma primeiro
COPY package*.json ./
COPY prisma ./prisma/

# Instala as dependências (já gera o Prisma Client automaticamente)
RUN npm install

# Copia o restante do código
COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]