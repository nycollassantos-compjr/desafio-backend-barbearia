const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // 1. Verificar se o header de autorização foi enviado
  if (!authHeader) {
    return res.status(401).json({ mensagem: 'Token não fornecido.' });
  }

  // 2. Validar formato "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    return res.status(401).json({ mensagem: 'Erro no token: formato inválido.' });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ mensagem: 'Token malformatado.' });
  }

  // 3. Verificar se o token é válido e assinado
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Injeta os dados do usuário na requisição para uso posterior
    req.usuarioId = decoded.id;
    req.usuarioPerfil = decoded.perfil;

    return next();
  } catch (err) {
    return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
  }
}

module.exports = authMiddleware;