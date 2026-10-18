const { Router } = require('express');
const AuthController = require('../controllers/AuthController');
const PasswordController = require('../controllers/PasswordController');
const authMiddleware = require('../middlewares/authMiddleware');

const authRoutes = Router();

authRoutes.post('/registrar', AuthController.registrar);
authRoutes.post('/login', AuthController.login);

// Rotas de Recuperação de Senha
authRoutes.post('/esqueci-senha', PasswordController.esqueciSenha);
authRoutes.post('/redefinir-senha', PasswordController.redefinirSenha);

// Rota de teste protegida por JWT
authRoutes.get('/me', authMiddleware, (req, res) => {
  return res.json({
    mensagem: 'Acesso autorizado!',
    usuarioId: req.usuarioId,
    perfil: req.usuarioPerfil,
  });
});

module.exports = authRoutes;