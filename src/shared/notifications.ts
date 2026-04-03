import { enviarNotificacionEmail } from './resend.js';

export const MailService = {
  
  //Mail para CU 009: Aprobación
  enviarMailSolicitudViajeAprobada: async (usuario: any, viaje: any) => {
    const sujeto = 'Tu solicitud de viaje ha sido aprobada - Find Your Trip';
    const titulo = `¡Buenas noticias, ${usuario.nombreUsuario}!`;
    const contenido = `
      <p>Te informamos que tu solicitud para el siguiente viaje ha sido <b>aprobada</b>:</p>
      
      <div style="background: #f8f9fa; border-radius: 12px; padding: 15px; margin: 20px 0; border: 1px solid #e2eee2;">
        <p style="margin: 5px 0;">📍 <b>Origen:</b> ${viaje.viajeOrigen.nombre}</p>
        <p style="margin: 5px 0;">🏁 <b>Destino:</b> ${viaje.viajeDestino.nombre}</p>
        <p style="margin: 5px 0;">📅 <b>Fecha:</b> ${viaje.viajeFecha.split('-').reverse().join('/')}</p>
      </div>

      <p>Ahora podrás visualizar en la plataforma los datos de contacto del conductor por si necesitas comunicarte.</p>
      <p style="font-weight: bold; color: #2d4a2d;">¡Que tengas un lindo viaje! 🚗✨</p>
    `;
    return await enviarNotificacionEmail(usuario.email, sujeto, titulo, contenido);
  },

  
  //Mail para CU 009 / CU Comenzar: Denegación por solicitud pendiente/ Viaje completo
  enviarMailSolicitudViajeDenegada: async (usuario: any, viaje: any) => {
    const sujeto = 'Tu solicitud de viaje ha sido denegada - Find Your Trip';
    const titulo = `Hola, ${usuario.nombreUsuario}`;
    const contenido = `
      <p>Te informamos que tu solicitud para el siguiente viaje ha sido <b>denegada</b>:</p>

      <div style="background: #f8f9fa; border-radius: 12px; padding: 15px; margin: 20px 0; border: 1px solid #e2eee2;">
        <p style="margin: 5px 0;">📍 <b>Origen:</b> ${viaje.viajeOrigen.nombre}</p>
        <p style="margin: 5px 0;">🏁 <b>Destino:</b> ${viaje.viajeDestino.nombre}</p>
        <p style="margin: 5px 0;">📅 <b>Fecha:</b> ${viaje.viajeFecha.split('-').reverse().join('/')}</p>
      </div>

      <p>La denegación pudo deberse a alguno de estos motivos:</p>
      <ul style="color: #4a5a4a; line-height: 1.6;">
        <li>El conductor ha denegado tu solicitud.</li>
        <li>Todos los lugares del viaje se han ocupado.</li>
        <li>Tu solicitud no fue aprobada antes de que el viaje comenzara.</li>
      </ul>
      
      <p style="margin-top: 20px;">Lamentamos los inconvenientes, podés buscar nuevos viajes disponibles en la plataforma. </p>
    `;
    return await enviarNotificacionEmail(usuario.email, sujeto, titulo, contenido);
  }
};