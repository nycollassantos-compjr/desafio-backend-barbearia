// const express = require('express');

// // cria um novo app express
// const app = express();

// // configura o express para usar o padrão json de comunicação
// app.use(express.json());

// app.get('/health', (request, response) => {
//     response.send('API ativa');
// });


// let users = [];
// app.post('/users', (request, response) => {
//     const {name, email} = request.body;

//     const newUser = {name, email};
//     users.push(newUser);
//     response.send(newUser);
// })

// app.listen(3001);

const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configura o express para interpretar requisições JSON
app.use(express.json());

// Rota de Health Check
app.get('/health', (request, response) => {
    response.json({
        status: 'OK',
        message: 'API ativa e rodando com sucesso!'
    });
});

// Exemplo simples para teste de rotas
let users = [];
app.post('/users', (request, response) => {
    const { name, email } = request.body;
    const newUser = { name, email };
    users.push(newUser);
    return response.status(201).json(newUser);
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});