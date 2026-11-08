const { Router } = require('express');
const usuarioController = require('../controllers/UsuarioController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const usuarioRoutes = Router();

// Todas as rotas de usuários exigem autenticação prévia
usuarioRoutes.use(authMiddleware);

// Rota de perfil próprio (qualquer usuário logado pode editar seus próprios dados)
usuarioRoutes.put('/me', (req, res, next) => usuarioController.atualizar(req, res, next));

// Rotas restritas exclusivamente para administradores
usuarioRoutes.get('/', roleMiddleware(['ADMIN']), (req, res, next) => usuarioController.listar(req, res, next));
usuarioRoutes.delete('/:id', roleMiddleware(['ADMIN']), (req, res, next) => usuarioController.deletar(req, res, next));

module.exports = usuarioRoutes;