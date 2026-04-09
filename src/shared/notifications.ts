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
  },

  // Mail para Inhabilitación de Usuario
  enviarMailInhabilitacion: async (usuario: any, motivo: string, dias: string, fechaFin: Date) => {
    const sujeto = 'Tu usuario de Find Your Trip fue inhabilitado';
    const titulo = `¡Hola, ${usuario.nombreUsuario}!`;
    const contenido = `
      <p>Te informamos que tu cuenta ha sido <b>inhabilitada</b> por el administrador.</p>

      <div style="background: #f8f9fa; border-radius: 12px; padding: 15px; margin: 20px 0; border: 1px solid #e2eee2;">
        <p style="margin: 5px 0;"><b>Motivo:</b> ${motivo}</p>
        <p style="margin: 5px 0;"><b>Duración:</b> ${dias} días</p>
        <p style="margin: 5px 0;"><b>Fecha de fin:</b> ${fechaFin.toLocaleDateString()}</p>
      </div>

      <p>Durante ese periodo no vas a poder usar la plataforma.</p>
    `;
    return await enviarNotificacionEmail(usuario.email, sujeto, titulo, contenido);
  },

  // Mail para solicitud de ser conductor
  enviarMailSolicitudParaSerConductor: async (usuario: any, estadoConductor: string) => {
    const estado = estadoConductor === 'aprobado' ? 'aprobada' : 'denegada';
    const sujeto = 'Novedades sobre tu solicitud para ser conductor';
    const titulo = `¡Hola, ${usuario.nombreUsuario}!`;
    const contenido = `
      <p>Tu solicitud para ser conductor ha sido <b>${estado}</b>.</p>
      ${
        estadoConductor === 'aprobado'
          ? '<p>Ya podés publicar viajes como conductor.</p>'
          : '<p>Lamentablemente no hemos podido aprobar tu solicitud en este momento.</p>'
      }
    `;
    return await enviarNotificacionEmail(usuario.email, sujeto, titulo, contenido);
  },

  // Mail para recuperación de contraseña
  enviarMailCodigoRecuperacion: async (usuario: any, codigo: string) => {
    const sujeto = 'Código de recuperación - Find Your Trip';
    const titulo = `Hola ${usuario.nombreUsuario}`;
    const contenido = `
      <p>Tu código de recuperación de contraseña es: <strong><span style="font-size: 24px; letter-spacing: 2px;">${codigo}</span></strong></p>
      <p>Este código expira en 45 minutos.</p>
    `;
    return await enviarNotificacionEmail(usuario.email, sujeto, titulo, contenido);
  },

  // Mail para viaje cancelado
  enviarMailViajeCancelado: async (usuario: any, viaje: any, fueraDeTermino: boolean) => {
    const sujeto = 'Tu viaje programado ha sido cancelado - Find Your Trip';
    const titulo = `¡Hola, ${usuario.nombreUsuario}!`;
    const contenido = `
      <p>Te informamos que el conductor <b>${viaje.usuarioConductor.nombreUsuario}</b> ha cancelado el siguiente viaje:</p>
      <div style="background: #f8f9fa; border-radius: 12px; padding: 15px; margin: 20px 0; border: 1px solid #e2eee2;">
        <p style="margin: 5px 0;">📍 <b>Origen:</b> ${viaje.viajeOrigen.nombre}</p>
        <p style="margin: 5px 0;">🏁 <b>Destino:</b> ${viaje.viajeDestino.nombre}</p>
        <p style="margin: 5px 0;">📅 <b>Fecha:</b> ${viaje.viajeFecha.split('-').reverse().join('/')}</p>
      </div>
      ${
        fueraDeTermino
          ? '<p>Debido a que la cancelación fue sobre la hora, podés <b>calificar al conductor</b> ingresando a la plataforma para contar tu experiencia.</p>'
          : '<p>Lamentamos los inconvenientes. Podés buscar nuevos viajes disponibles en la plataforma.</p>'
      }
    `;
    return await enviarNotificacionEmail(usuario.email, sujeto, titulo, contenido);
  },

  // Mail para cuando el viaje comienza (Aviso a pasajeros aprobados)
  enviarMailViajeComenzado: async (usuario: any, viaje: any) => {
    const sujeto = '¡Tu viaje ha comenzado! - Find Your Trip';
    const titulo = `¡A viajar, ${usuario.nombreUsuario}!`;
    const contenido = `
      <p>Te informamos que el conductor ha marcado el inicio del viaje. ¡Esperamos que tengas un excelente trayecto!</p>
      
      <div style="background: #f8f9fa; border-radius: 12px; padding: 15px; margin: 20px 0; border: 1px solid #e2eee2;">
        <p style="margin: 5px 0;">📍 <b>Origen:</b> ${viaje.viajeOrigen.nombre}</p>
        <p style="margin: 5px 0;">🏁 <b>Destino:</b> ${viaje.viajeDestino.nombre}</p>
        <p style="margin: 5px 0;">📅 <b>Fecha:</b> ${viaje.viajeFecha.split('-').reverse().join('/')}</p>
      </div>

      <p style="font-weight: bold; color: #2d4a2d;">¡Buen viaje! 🚗💨</p>
    `;
    return await enviarNotificacionEmail(usuario.email, sujeto, titulo, contenido);
  },
};