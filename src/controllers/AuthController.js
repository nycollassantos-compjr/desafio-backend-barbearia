const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../database/prisma');

class AuthController {
  // POST /auth/registrar
  async registrar(req, res) {
    try {
      const { nome, email, senha, telefone, perfil } = req.body;

      // 1. Validar campos obrigatórios
      if (!nome || !email || !senha || !telefone) {
        return res.status(400).json({ mensagem: 'Preencha todos os campos obrigatórios.' });
      }

      // 2. Verificar se o e-mail já está em uso
      const usuarioExistente = await prisma.usuario.findUnique({ where: { email } });
      if (usuarioExistente) {
        return res.status(400).json({ mensagem: 'E-mail já cadastrado.' });
      }

      // 3. Criptografar a senha (hash)
      const senha_hash = await bcrypt.hash(senha, 10);

      // 4. Segurança: Garantir que a rota pública crie por padrão o perfil CLIENTE
      const perfilFinal = perfil === 'ADMIN' ? 'ADMIN' : 'CLIENTE';

      // 5. Salvar o novo usuário no banco de dados
      const novoUsuario = await prisma.usuario.create({
        data: {
          nome,
          email,
          senha_hash,
          telefone,
          perfil: perfilFinal,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          perfil: true,
        },
      });

      return res.status(201).json({
        mensagem: 'Usuário cadastrado com sucesso!',
        usuario: novoUsuario,
      });
    } catch (error) {
      return res.status(500).json({ mensagem: 'Erro interno no servidor.', erro: error.message });
    }
  }

  // POST /auth/login
  async login(req, res) {
    try {
      const { email, senha } = req.body;

      // 1. Validar entrada
      if (!email || !senha) {
        return res.status(400).json({ mensagem: 'Informe o e-mail e a senha.' });
      }

      // 2. Buscar usuário pelo e-mail
      const usuario = await prisma.usuario.findUnique({ where: { email } });
      if (!usuario) {
        return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
      }

      // 3. Comparar a senha informada com o hash salvo no banco
      const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
      if (!senhaValida) {
        return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
      }

      // 4. Gerar o Token JWT contendo os dados essenciais (id e perfil)
      const token = jwt.sign(
        { id: usuario.id, perfil: usuario.perfil },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
      );

      // 5. Retornar resposta sem expor a senha
      return res.status(200).json({
        mensagem: 'Login realizado com sucesso!',
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil,
        },
      });
    } catch (error) {
      return res.status(500).json({ mensagem: 'Erro interno no servidor.', erro: error.message });
    }
  }
}

module.exports = new AuthController();