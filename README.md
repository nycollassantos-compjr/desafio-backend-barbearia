# desafio-backend-barbearia
Sistema de gerenciamento de agendamentos para barbearia - Desafio Back-End Comp Júnior 2026/2

# ✂️ Barbearia - Sistema de Agendamentos

Projeto desenvolvido para o **Desafio Back-End 2026/2** da Comp Júnior.

---

## 📌 1. Tema e Escopo
O projeto se trata de um sistema de gerenciamento de agendamentos de serviços voltado para barbearias. A aplicação permite que clientes realizem o agendamento de serviços com horários marcados, enquanto administradores gerenciam o catálogo de serviços e a agenda da barbearia.

### Propósito do Sistema
Eliminar conflitos de horários na agenda, oferecer controle detalhado sobre os serviços oferecidos e automatizar o fluxo de marcação de horários para os clientes.

---

**API externa escolhida:** No desenvolvimento do sistema de agendamentos da barbearia, foi integrada a Open-Meteo Weather Forecast API (uma API pública de dados meteorológicos).

O propósito dessa integração é fornecer valor prático às tomadas de decisão de clientes e barbeiros. Ao realizar a listagem de agendamentos (GET /agendamentos), a aplicação realiza chamadas assíncronas em tempo real consultando os dados climáticos previstos para o horário exato do corte (timezone: UTC).

**Utilidade da API:**
**Para o Cliente:** Permite antecipar condições adversas de tempo (como alta probabilidade de chuva ou temperaturas extremas) no horário exato do seu deslocamento até a barbearia.

**Para a Barbearia:** Auxilia no gerenciamento de eventuais imprevistos ou atrasos causados por tempestades em horários específicos.


---

## 🗄 2. Entidades Principais e Modelagem (DER)

O sistema conta com **3 entidades de negócio** principais:

1. **`Usuario`**: Representa os usuários do sistema, divididos entre os perfis de **Cliente** e **Administrador** (barbeiros/gestores).
2. **`Servico`**: Representa os serviços oferecidos (ex.: Corte de Cabelo, Barba, Combo) com preços e durações personalizadas.
3. **`Agendamento`**: A entidade central que vincula um cliente a um serviço em uma data e hora específicas.

### Diagrama Entidade-Relacionamento (DER)

```mermaid
erDiagram
    USUARIO ||--o{ AGENDAMENTO : "realiza"
    AGENDAMENTO }o--|| SERVICO : "inclui"

    USUARIO {
        uuid id PK
        string nome
        string email
        string senha_hash
        string telefone
        enum perfil "CLIENTE | ADMIN"
    }

    SERVICO {
        uuid id PK
        string nome
        string descricao
        int duracao_minutos
        decimal preco
        boolean ativo
    }

    AGENDAMENTO {
        uuid id PK
        uuid usuario_id FK
        uuid servico_id FK
        datetime data_hora
        string status "AGENDADO | CONCLUIDO | CANCELADO | INDISPONÍVEL"
        string observacoes
    }
