const prisma = require('../database/prisma');
const climaService = require('../services/climaService');

// Auxiliar: Converte string de data/hora no Horário de Brasília para Date UTC (adiciona sufixo -03:00 se necessário)
function brasiliaParaUTC(dataHoraLocalStr) {
  if (typeof dataHoraLocalStr !== 'string') return new Date(NaN);
  
  const isoComTimezone = dataHoraLocalStr.endsWith('Z') || dataHoraLocalStr.includes('-03:00')
    ? dataHoraLocalStr 
    : `${dataHoraLocalStr}-03:00`;
  
  return new Date(isoComTimezone);
}

// Auxiliar: Formata data UTC gravada no banco para exibição legível em Horário de Brasília
function utcParaBrasilia(dataUTC) {
  const dataObj = new Date(dataUTC);
  if (isNaN(dataObj.getTime())) return null;

  return dataObj.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

class AgendamentoController {
  // POST /agendamentos
  async criar(req, res, next) {
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

      // 3. Regra de Negócio: Tratar entrada como Horário de Brasília e converter para UTC
      const inicioNovo = brasiliaParaUTC(data_hora);
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

        return inicioNovo < fimExistente && fimNovo > inicioExistente;
      });

      if (temConflito) {
        return res.status(409).json({ 
          mensagem: 'O barbeiro estará ocupado durante este período. Por favor, escolha outro horário.' 
        });
      }

      // 7. Salvar o agendamento no banco em UTC
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
        agendamento: {
          ...novoAgendamento,
          data_hora_local: utcParaBrasilia(novoAgendamento.data_hora),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /agendamentos
  async listar(req, res, next) {
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

      // Busca a previsão do tempo usando a data UTC do banco e anexa a data formatada em Horário de Brasília
      const agendamentosComClima = await Promise.all(
        agendamentos.map(async (agendamento) => {
          const clima = await climaService.obterPrevisaoTempo(agendamento.data_hora);
          return {
            ...agendamento,
            data_hora_local: utcParaBrasilia(agendamento.data_hora),
            previsao_tempo: clima
          };
        })
      );

      return res.status(200).json(agendamentosComClima);
    } catch (error) {
      next(error);
    }
  }

  // PATCH /agendamentos/:id/cancelar
  async cancelar(req, res, next) {
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
        agendamento: {
          ...agendamentoAtualizado,
          data_hora_local: utcParaBrasilia(agendamentoAtualizado.data_hora),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AgendamentoController();