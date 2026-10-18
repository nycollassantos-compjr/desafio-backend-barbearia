const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../database/prisma');
const { enviarEmailRecuperacao } = require('../services/mailService');

class PasswordController {
  // POST /auth/esqueci-senha
  async esqueciSenha(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ mensagem: 'Informe o e-mail.' });
      }

      // 1. Verificar se o usuário existe
      const usuario = await prisma.usuario.findUnique({ where: { email } });
      if (!usuario) {
        // Por segurança, retornamos 200/404 generico para não expor quais e-mails existem na base
        return res.status(404).json({ mensagem: 'E-mail não encontrado no sistema.' });
      }

      // 2. Gerar um token aleatório e definir expiração de 15 minutos
      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // +15 min

      // 3. Salvar o token e a data limite no banco
      await prisma.usuario.update({
        where: { email },
        data: {
          reset_password_token: resetToken,
          reset_password_expires: resetExpires,
        },
      });

      // 4. Disparar o e-mail
      await enviarEmailRecuperacao(email, resetToken);

      return res.status(200).json({
        mensagem: 'E-mail de recuperação enviado com sucesso!',
      });
    } catch (error) {
      return res.status(500).json({ mensagem: 'Erro ao processar solicitação de recuperação.', erro: error.message });
    }
  }

  // POST /auth/redefinir-senha
  async redefinirSenha(req, res) {
    try {
      const { token, novaSenha } = req.body;

      if (!token || !novaSenha) {
        return res.status(400).json({ mensagem: 'Informe o token e a nova senha.' });
      }

      // 1. Buscar usuário com o token fornecido
      const usuario = await prisma.usuario.findFirst({
        where: {
          reset_password_token: token,
        },
      });

      if (!usuario) {
        return res.status(400).json({ mensagem: 'Token inválido ou não encontrado.' });
      }

      // 2. Validar se o token já expirou
      if (usuario.reset_password_expires < new Date()) {
        return res.status(400).json({ mensagem: 'Token expirado. Solicite uma nova recuperação.' });
      }

      // 3. Criptografar a nova senha
      const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

      // 4. Atualizar senha e limpar os campos de redefinição
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          senha_hash: novaSenhaHash,
          reset_password_token: null,
          reset_password_expires: null,
        },
      });

      return res.status(200).json({
        mensagem: 'Senha redefinida com sucesso! Você já pode fazer login com a nova senha.',
      });
    } catch (error) {
      return res.status(500).json({ mensagem: 'Erro ao redefinir a senha.', erro: error.message });
    }
  }
}

module.exports = new PasswordController();