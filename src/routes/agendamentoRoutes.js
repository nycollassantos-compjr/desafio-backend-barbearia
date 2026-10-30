const { Router } = require('express');
const AgendamentoController = require('../controllers/AgendamentoController');
const authMiddleware = require('../middlewares/authMiddleware');

const agendamentoRoutes = Router();

// Todas as rotas de agendamento exigem estar autenticado
agendamentoRoutes.use(authMiddleware);

agendamentoRoutes.post('/', AgendamentoController.criar);
agendamentoRoutes.get('/', AgendamentoController.listar);
agendamentoRoutes.patch('/:id/cancelar', AgendamentoController.cancelar);

module.exports = agendamentoRoutes;