import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Función centralizada para enviar correos con redirección de prueba
 * @param to - Email del destinatario original
 * @param subject - Asunto del mail
 * @param tituloHeader - Título grande dentro del mail
 * @param htmlContent - Mensaje principal
 */
export const enviarNotificacionEmail = async (to: string, subject: string, tituloHeader: string, htmlContent: string) => {
  const emailDueño = process.env.MAIL_USER || 'lucilavega45@gmail.com';

  try {
    await resend.emails.send({
      from: 'Find Your Trip <onboarding@resend.dev>',
      to: [emailDueño], // Forzamos el envío a la cuenta verificada
      subject: `${subject}`,
      html: `
        <div style="background: #fff3cd; color: #856404; padding: 12px; border: 1px dashed #ffeeba; margin-bottom: 20px; font-family: sans-serif; font-size: 13px; text-align: center; border-radius: 10px;">
          Este correo originalmente era para: <b>${to}</b>
        </div>

        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f4; padding: 50px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(45, 74, 45, 0.05); border: 1px solid #e2eee2;">
            
            <div style="background-color: #b2d8b2; padding: 35px 20px; text-align: center;">
              <h1 style="margin: 0; color: #2d4a2d; font-size: 28px; letter-spacing: -1px; font-weight: 700;">Find Your Trip</h1>
            </div>

            <div style="padding: 45px 35px; color: #4a5a4a; line-height: 1.7; font-size: 16px;">
              <h2 style="color: #2d4a2d; margin-top: 0; font-size: 22px;">${tituloHeader}</h2>
              
              <div style="margin: 20px 0;">
                ${htmlContent}
              </div>

              <div style="text-align: center; margin-top: 35px;">
                <a href="http://localhost:5173" style="background-color: #2d4a2d; color: #ffffff; padding: 14px 30px; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block;">Ir a la plataforma</a>
              </div>
            </div>

            <div style="background-color: #fafdfa; padding: 25px; text-align: center; font-size: 12px; color: #9fb39f; border-top: 1px solid #f0f4f0;">
              <p style="margin: 0;">© 2026 Find Your Trip</p>
              <p style="margin: 5px 0 0;">Rosario, Santa Fe, Argentina</p>
            </div>
          </div>
        </div>
      `,
    });
    console.log(`Redirigido con éxito a ${emailDueño} (Originalmente para: ${to})`);
  } catch (error) {
    console.error("Error al enviar con Resend:", error);
  }
};