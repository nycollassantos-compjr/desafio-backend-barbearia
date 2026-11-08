const express = require('express');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const servicoRoutes = require('./routes/servicoRoutes');
const agendamentoRoutes = require('./routes/agendamentoRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 3001;

// Configura o express para interpretar requisições JSON
app.use(express.json());

// Rota de Health Check (útil para verificar se o servidor está rodando)
app.get('/health', (request, response) => {
    return response.json({
        status: 'OK',
        message: 'API da Barbearia ativa e rodando com sucesso!'
    });
});

// Registrar rotas
app.use('/auth', authRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/servicos', servicoRoutes);
app.use('/agendamentos', agendamentoRoutes);
app.use(errorMiddleware);

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});