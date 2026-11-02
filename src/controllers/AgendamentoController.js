const prisma = require('../database/prisma');
const climaService = require('../services/climaService');

class AgendamentoController {
  // POST /agendamentos
  async criar(req, res) {
    try {
      const { servico_id, data_hora, observacoes } = req.body;
      const usuario_id = req.usuarioId;

      // 1. Validar campos obrigatórios
      if (!servico_id || !data_hora) {
        return res.status(400).json({ 
          mensagem: 'Informe o serviço e a data/hora do agendamento.' 
        });
      }

      // 2. Regra de Negócio: Verificar se o serviço existe e está ativo
      const servico = await prisma.servico.findUnique({ where: { id: servico_id } });
      if (!servico || !servico.ativo) {
        return res.status(404).json({ 
          mensagem: 'Serviço não encontrado ou indisponível para agendamento.' 
        });
      }

      // 3. Regra de Negócio: Impedir agendamento no passado
      const inicioNovo = new Date(data_hora);
      if (isNaN(inicioNovo.getTime())) {
        return res.status(400).json({ mensagem: 'Formato de data/hora inválido.' });
      }

      if (inicioNovo < new Date()) {
        return res.status(400).json({ 
          mensagem: 'Não é possível realizar agendamentos em datas ou horários passados.' 
        });
      }

      // 4. Calcular o horário de término do NOVO agendamento
      const fimNovo = new Date(inicioNovo.getTime() + servico.duracao_minutos * 60000);

      // 5. Buscar agendamentos ativos para verificar sobreposição de horários
      const agendamentosAtivos = await prisma.agendamento.findMany({
        where: {
          status: 'AGENDADO',
        },
        include: {
          servico: {
            select: { duracao_minutos: true },
          },
        },
      });

      // 6. Regra de Negócio: Validar sobreposição de intervalos de tempo
      const temConflito = agendamentosAtivos.some((agendamento) => {
        const inicioExistente = new Date(agendamento.data_hora);
        const fimExistente = new Date(
          inicioExistente.getTime() + agendamento.servico.duracao_minutos * 60000
        );

        // Checa se os intervalos se cruzam
        return inicioNovo < fimExistente && fimNovo > inicioExistente;
      });

      if (temConflito) {
        return res.status(409).json({ 
          mensagem: 'O barbeiro estará ocupado durante este período. Por favor, escolha outro horário.' 
        });
      }

      // 7. Salvar o agendamento no banco
      const novoAgendamento = await prisma.agendamento.create({
        data: {
          usuario_id,
          servico_id,
          data_hora: inicioNovo,
          status: 'AGENDADO',
          observacoes,
        },
        include: {
          servico: {
            select: { nome: true, preco: true, duracao_minutos: true },
          },
          usuario: {
            select: { nome: true, email: true, telefone: true },
          },
        },
      });

      return res.status(201).json({
        mensagem: 'Agendamento realizado com sucesso!',
        agendamento: novoAgendamento,
      });
    } catch (error) {
      return res.status(500).json({ 
        mensagem: 'Erro ao criar agendamento.', 
        erro: error.message 
      });
    }
  }

  // GET /agendamentos
  async listar(req, res) {
    try {
      const usuario_id = req.usuarioId;
      const perfil = req.usuarioPerfil;

      const OndeFiltro = perfil === 'ADMIN' ? {} : { usuario_id };

      const agendamentos = await prisma.agendamento.findMany({
        where: OndeFiltro,
        orderBy: { data_hora: 'asc' },
        include: {
          servico: { select: { nome: true, preco: true, duracao_minutos: true } },
          usuario: { select: { nome: true, email: true, telefone: true } },
        },
      });

      // Busca a previsão do tempo de forma assíncrona para cada agendamento
      const agendamentosComClima = await Promise.all(
        agendamentos.map(async (agendamento) => {
          const clima = await climaService.obterPrevisaoTempo(agendamento.data_hora);
          return {
            ...agendamento,
            previsao_tempo: clima
          };
        })
      );

      return res.status(200).json(agendamentosComClima);
    } catch (error) {
      return res.status(500).json({ 
        mensagem: 'Erro ao listar agendamentos.', 
        erro: error.message 
      });
    }
  }

  // PATCH /agendamentos/:id/cancelar
  async cancelar(req, res) {
    try {
      const { id } = req.params;
      const usuario_id = req.usuarioId;
      const perfil = req.usuarioPerfil;

      const agendamento = await prisma.agendamento.findUnique({ where: { id } });

      if (!agendamento) {
        return res.status(404).json({ mensagem: 'Agendamento não encontrado.' });
      }

      if (perfil !== 'ADMIN' && agendamento.usuario_id !== usuario_id) {
        return res.status(403).json({ 
          mensagem: 'Acesso negado. Você só pode cancelar os seus próprios agendamentos.' 
        });
      }

      if (agendamento.status === 'CANCELADO') {
        return res.status(400).json({ mensagem: 'Este agendamento já se encontra cancelado.' });
      }

      const agendamentoAtualizado = await prisma.agendamento.update({
        where: { id },
        data: { status: 'CANCELADO' },
      });

      return res.status(200).json({
        mensagem: 'Agendamento cancelado com sucesso!',
        agendamento: agendamentoAtualizado,
      });
    } catch (error) {
      return res.status(500).json({ 
        mensagem: 'Erro ao cancelar agendamento.', 
        erro: error.message 
      });
    }
  }
}

module.exports = new AgendamentoController();