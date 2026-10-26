const { Router } = require('express');
const ServicoController = require('../controllers/ServicoController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const servicoRoutes = Router();

// Todas as rotas de serviços exigem autenticação
servicoRoutes.use(authMiddleware);

// Rota de listagem (Livre para CLIENTE e ADMIN)
servicoRoutes.get('/', ServicoController.listar);

// Rotas administrativas (Apenas ADMIN)
servicoRoutes.post('/', roleMiddleware(['ADMIN']), ServicoController.criar);
servicoRoutes.put('/:id', roleMiddleware(['ADMIN']), ServicoController.atualizar);
servicoRoutes.delete('/:id', roleMiddleware(['ADMIN']), ServicoController.deletar);

module.exports = servicoRoutes;