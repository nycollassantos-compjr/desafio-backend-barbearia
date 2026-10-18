const nodemailer = require('nodemailer');

// Configura o transportador com as variáveis do .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function enviarEmailRecuperacao(emailDestino, token) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: emailDestino,
    subject: 'Recuperação de Senha - Barbearia',
    html: `
      <h2>Recuperação de Senha</h2>
      <p>Você solicitou a redefinição de senha para a sua conta.</p>
      <p>Utilize o token abaixo no seu aplicativo para redefinir sua senha:</p>
      <h3 style="background-color: #f4f4f4; padding: 10px; display: inline-block;">${token}</h3>
      <p>Este token é válido por <strong>15 minutos</strong>.</p>
      <p>Se você não solicitou esta alteração, ignore este e-mail.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = {
  enviarEmailRecuperacao,
};