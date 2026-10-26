const prisma = require('../database/prisma');

class ServicoController {
  // POST /servicos (Apenas ADMIN)
  async criar(req, res) {
    try {
      const { nome, descricao, duracao_minutos, preco } = req.body;

      // 1. Validação de campos obrigatórios
      if (!nome || !duracao_minutos || preco === undefined) {
        return res.status(400).json({ 
          mensagem: 'Nome, duração em minutos e preço são obrigatórios.' 
        });
      }

      // 2. Criar serviço no banco de dados
      const novoServico = await prisma.servico.create({
        data: {
          nome,
          descricao,
          duracao_minutos: Number(duracao_minutos),
          preco: Number(preco),
        },
      });

      return res.status(201).json({
        mensagem: 'Serviço cadastrado com sucesso!',
        servico: novoServico,
      });
    } catch (error) {
      return res.status(500).json({ 
        mensagem: 'Erro ao cadastrar serviço.', 
        erro: error.message 
      });
    }
  }

  // GET /servicos (Lista apenas serviços ativos)
  async listar(req, res) {
    try {
      const servicos = await prisma.servico.findMany({
        where: { ativo: true },
        orderBy: { nome: 'asc' },
      });

      return res.status(200).json(servicos);
    } catch (error) {
      return res.status(500).json({ 
        mensagem: 'Erro ao listar serviços.', 
        erro: error.message 
      });
    }
  }

  // PUT /servicos/:id (Apenas ADMIN)
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, descricao, duracao_minutos, preco, ativo } = req.body;

      // 1. Verificar se o serviço existe
      const servicoExistente = await prisma.servico.findUnique({ where: { id } });
      if (!servicoExistente) {
        return res.status(404).json({ mensagem: 'Serviço não encontrado.' });
      }

      // 2. Atualizar o serviço
      const servicoAtualizado = await prisma.servico.update({
        where: { id },
        data: {
          nome: nome !== undefined ? nome : servicoExistente.nome,
          descricao: descricao !== undefined ? descricao : servicoExistente.descricao,
          duracao_minutos: duracao_minutos !== undefined ? Number(duracao_minutos) : servicoExistente.duracao_minutos,
          preco: preco !== undefined ? Number(preco) : servicoExistente.preco,
          ativo: ativo !== undefined ? ativo : servicoExistente.ativo,
        },
      });

      return res.status(200).json({
        mensagem: 'Serviço atualizado com sucesso!',
        servico: servicoAtualizado,
      });
    } catch (error) {
      return res.status(500).json({ 
        mensagem: 'Erro ao atualizar serviço.', 
        erro: error.message 
      });
    }
  }

  // DELETE /servicos/:id (Apenas ADMIN - Soft Delete / Desativação)
  async deletar(req, res) {
    try {
      const { id } = req.params;

      const servicoExistente = await prisma.servico.findUnique({ where: { id } });
      if (!servicoExistente) {
        return res.status(404).json({ mensagem: 'Serviço não encontrado.' });
      }

      // Em vez de apagar do banco (hard delete), desativamos (soft delete) para preservar histórico de agendamentos
      await prisma.servico.update({
        where: { id },
        data: { ativo: false },
      });

      return res.status(200).json({
        mensagem: 'Serviço desativado com sucesso!',
      });
    } catch (error) {
      return res.status(500).json({ 
        mensagem: 'Erro ao desativar serviço.', 
        erro: error.message 
      });
    }
  }
}

module.exports = new ServicoController();