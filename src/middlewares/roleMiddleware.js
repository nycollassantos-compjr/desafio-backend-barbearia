function roleMiddleware(perfisPermitidos) {
    return (req, res, next) => {
      // Verifica se o perfil do usuário logado tem permissão
      if (!perfisPermitidos.includes(req.usuarioPerfil)) {
        return res.status(403).json({ 
          mensagem: 'Acesso negado. Você não tem permissão para acessar este recurso.' 
        });
      }
  
      return next();
    };
  }
  
  module.exports = roleMiddleware;