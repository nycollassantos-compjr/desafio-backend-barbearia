const axios = require('axios');

async function obterPrevisaoTempo(dataHoraISO, lat = -21.248, lon = -44.996) {
  try {
    const dataObj = new Date(dataHoraISO);

    // Garante extração do YYYY-MM-DD em UTC
    const dataFormatada = dataObj.toISOString().split('T')[0];
    
    // Obtém a hora exata em UTC (ex: 14)
    const horaAgendamento = dataObj.getUTCHours();

    // Requisita a API fixando timezone em UTC
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: 'temperature_2m,precipitation_probability',
        start_date: dataFormatada,
        end_date: dataFormatada,
        timezone: 'UTC'
      }
    });

    const hourly = response.data.hourly;

    if (!hourly || !hourly.time) {
      return null;
    }

    // Busca o índice exato baseado no horário em UTC
    const indiceHora = hourly.time.findIndex((item) => {
      // Retorna a hora extraída do ISO UTC da Open-Meteo
      const horaItem = parseInt(item.split('T')[1].split(':')[0], 10);
      return horaItem === horaAgendamento;
    });

    if (indiceHora !== -1) {
      const temperatura = hourly.temperature_2m[indiceHora];
      const probabilidadeChuva = hourly.precipitation_probability[indiceHora];

      const horaFormatadaLocal = dataObj.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit'
      });

      return {
        horario: horaFormatadaLocal,
        temperatura: `${temperatura}°C`,
        probabilidade_chuva: `${probabilidadeChuva}%`
      };
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar previsão do tempo:', error.message);
    return null;
  }
}

module.exports = { obterPrevisaoTempo };