function errorMiddleware(err, req, res, next) {
    // Exibe o log detalhado no console do servidor para fins de depuração
    console.error('[ERRO INTERNO CAPTURADO]:', err);
  
    // 1. Tratamento para JSON malformado enviado no body da requisição
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({
        mensagem: 'O corpo da requisição (JSON) está malformatado.'
      });
    }
  
    // 2. Tratamento para erros de parsing de sintaxe ou payload do Express
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({
        mensagem: 'Sintaxe do payload inválida.'
      });
    }
  
    // 3. Resposta genérica para evitar vazamento de dados internos (stack traces, Prisma, etc.)
    return res.status(500).json({
      mensagem: 'Ocorreu um erro interno no servidor. Por favor, tente novamente mais tarde.'
    });
  }
  
  module.exports = errorMiddleware;