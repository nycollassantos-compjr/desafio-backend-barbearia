const prisma = require('../database/prisma');

class UsuarioController {
  // GET /usuarios (Apenas ADMIN)
  async listar(req, res, next) {
    try {
      const usuarios = await prisma.usuario.findMany({
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          perfil: true
        },
        orderBy: { nome: 'asc' },
      });

      return res.status(200).json(usuarios);
    } catch (error) {
      next(error);
    }
  }

  // PUT /usuarios/me (Atualizar o próprio perfil)
  async atualizar(req, res, next) {
    try {
      const usuario_id = req.usuarioId; // Obtido do token JWT
      const { nome, telefone, email } = req.body;

      // 1. Validar se pelo menos um campo foi enviado
      if (!nome && !telefone && !email) {
        return res.status(400).json({ 
          mensagem: 'Informe ao menos um campo para atualização (nome, telefone ou email).' 
        });
      }

      // 2. Se for alterar e-mail, verificar se já pertence a outro usuário
      if (email) {
        const emailEmUso = await prisma.usuario.findFirst({
          where: { email, NOT: { id: usuario_id } }
        });

        if (emailEmUso) {
          return res.status(400).json({ mensagem: 'Este e-mail já está em uso por outra conta.' });
        }
      }

      // 3. Atualizar dados no banco (sem permitir alterar senha ou perfil por aqui)
      const usuarioAtualizado = await prisma.usuario.update({
        where: { id: usuario_id },
        data: {
          ...(nome && { nome }),
          ...(telefone && { telefone }),
          ...(email && { email }),
        },
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          perfil: true,
        },
      });

      return res.status(200).json({
        mensagem: 'Perfil atualizado com sucesso!',
        usuario: usuarioAtualizado,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /usuarios/:id (Apenas ADMIN)
async deletar(req, res, next) {
  try {
    const { id } = req.params;
    const admin_id = req.usuarioId;

    // 1. Impedir autoexclusão de administrador
    if (id === admin_id) {
      return res.status(400).json({ 
        mensagem: 'Você não pode excluir a sua própria conta de administrador.' 
      });
    }

    // 2. Verificar se o usuário existe
    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }

    // 3. Remover primeiro todos os agendamentos vinculados ao usuário
    await prisma.agendamento.deleteMany({
      where: { usuario_id: id }
    });

    // 4. Deletar o usuário do banco
    await prisma.usuario.delete({ where: { id } });

    return res.status(200).json({ mensagem: 'Usuário e seus agendamentos foram excluídos com sucesso!' });
  } catch (error) {
    next(error);
  }
}
}

module.exports = new UsuarioController();