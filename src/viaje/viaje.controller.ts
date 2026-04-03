import { Request, Response, NextFunction } from 'express';
import { orm } from '../shared/db/orm.js';
import { Viaje } from './viaje.entity.js';
import { Vehiculo } from '../usuario/vehiculo.entity.js';
import { Usuario } from '../usuario/usuario.entity.js';
import { viajeSchema } from './viaje.schema.js';
import { SolicitudViajeSchema } from './solicitudViaje.schema.js';
import { SolicitudViaje } from './solicitudViaje.entity.js';
import { Calificacion } from '../calificacion/calificacion.entity.js';
import { registrarCalificacionGenerica } from '../calificacion/calificacion.controller.js';
import { EstadoSolicitud, EstadoViaje } from '../shared/enums.js';
import { enviarNotificacionEmail } from '../shared/resend.js';
import { MailService } from '../shared/notifications.js';

const em = orm.em;

export function viajeValidator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const result = viajeSchema.safeParse(req.body);

  if (!result.success) {
    const mensajes = result.error.issues.map((issue) => ({
      campo: issue.path.join('.'),
      mensaje: issue.message,
    }));
    const mensajesTexto = mensajes.map((e) => e.mensaje).join(', ');

    return res.status(400).json({
      message: `Error de validación: ${mensajesTexto}`,
    });
  }

  req.body.validatedData = result.data;
  next();
}

export function solicitudViajeValidator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const result = SolicitudViajeSchema.safeParse(req.body);

  if (!result.success) {
    const mensajes = result.error.issues.map((issue) => ({
      campo: issue.path.join('.'),
      mensaje: issue.message,
    }));
    const mensajesTexto = mensajes.map((e) => e.mensaje).join(', ');

    return res.status(400).json({
      message: `Error de validación: ${mensajesTexto}`,
    });
  }

  req.body.validatedData = result.data;
  next();
}

async function CU05PublicarViaje(req: Request, res: Response) {
  try {
    const datosViaje = req.body.validatedData;

    const conductor = await em.findOne(Usuario, {
      idUsuario: datosViaje.usuarioConductor,
    });

    if (!conductor) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    if (conductor.tipoUsuario !== 'conductor') {
      return res.status(403).json({
        message:
          'No tenés permisos de conductor. Por favor, registrate como tal.',
      });
    }
    if (conductor.estadoUsuario === 'inhabilitado') {
      return res.status(403).json({
        message: 'Tu cuenta de usuario se encuentra inhabilitada actualmente.',
      });
    }
    if (conductor.estadoConductor !== 'aprobado') {
      const mensaje =
        conductor.estadoConductor === 'pendiente'
          ? 'Tu registro de conductor aún está pendiente de aprobación.'
          : 'Tu solicitud de conductor ha sido denegada.';
      return res.status(403).json({ message: mensaje });
    }

    const vehiculoDoc = await em.findOne(Vehiculo, {
      patente: datosViaje.vehiculo,
    });

    if (!vehiculoDoc) {
      return res
        .status(404)
        .json({ message: 'El vehículo seleccionado no existe.' });
    }

    if (datosViaje.viajeCantLugares > vehiculoDoc.cantLugares) {
      return res.status(400).json({
        message: `Error: No podés ofrecer ${datosViaje.viajeCantLugares} lugares porque tu vehículo solo tiene capacidad para ${vehiculoDoc.cantLugares}.`,
      });
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [anio, mes, dia] = datosViaje.viajeFecha.split('-').map(Number);
    const fechaViajeObj = new Date(anio, mes - 1, dia); // Local time

    if (fechaViajeObj < hoy) {
      return res
        .status(400)
        .json({ message: 'No podés publicar un viaje con fecha pasada.' });
    }

    const viaje = em.create(Viaje, datosViaje);
    await em.flush();

    res.status(201).json({ message: 'Viaje publicado con éxito', data: viaje });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function CU06CancelarViaje(req: Request, res: Response) {
  try {
    const idViaje = Number.parseInt(req.params.id as string);
    const viaje = await em.findOne(
      Viaje,
      { viajeId: idViaje },
      { populate: ['usuarioConductor', 'viajeOrigen', 'viajeDestino'] },
    );

    if (!viaje) return res.status(404).json({ message: 'Viaje no encontrado' });

    const ahora = new Date();
    const fechaYHoraViaje = new Date(
      `${viaje.viajeFecha}T${viaje.viajeHorario}`,
    );
    // calculamos la diferencia en horas
    const difHoras =
      (fechaYHoraViaje.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    // si falta menos de 24hs, se registra como Finalizado para poder calificar
    const fueraDeTermino = difHoras < 24;
    viaje.viajeEstado = fueraDeTermino
      ? EstadoViaje.FINALIZADO
      : EstadoViaje.CANCELADO;

    // notificamos a los pasajeros aprobados por mail
    const solicitudesAprobadas = await em.find(
      SolicitudViaje,
      { viaje: viaje, estadoSolicitud: EstadoSolicitud.APROBADA },
      { populate: ['usuario'] },
    );

    const promesasEmails = solicitudesAprobadas.map((sol) => {
      const sujeto = 'Tu viaje programado ha sido cancelado - Find Your Trip';
      const tituloHeader = `¡Hola, ${sol.usuario.nombreUsuario}!`;
      const contenidoHtml = `
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

      return enviarNotificacionEmail(
        sol.usuario.email,
        sujeto,
        tituloHeader,
        contenidoHtml,
      ).catch((err) =>
        console.error('Error al enviar mail de cancelación:', err),
      );
    });

    await Promise.all(promesasEmails);
    await em.flush();

    res.status(200).json({
      message: fueraDeTermino
        ? 'El viaje ha sido cancelado, los pasajeros podrán calificarte por cancelación tardía si lo desean.'
        : 'El viaje ha sido cancelado.',
      nuevoEstado: viaje.viajeEstado,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function CU07SolicitarViaje01(req: Request, res: Response) {
  try {
    let filter: any = { viajeEstado: 'pendiente' };

    //Habria que cambiar lo de user id, el lugar donde se obtiene
    const usuarioId = Number.parseInt(req.query.usuarioId as string);

    let idsYaSolicitados: number[] = [];
    if (!isNaN(usuarioId)) {
      const solicitudesPrevias = await em.find(
        SolicitudViaje,
        {
          usuario: { idUsuario: usuarioId },
          estadoSolicitud: { $in: ['pendiente', 'aprobada'] },
        },
        { populate: ['viaje'] },
      );
      idsYaSolicitados = solicitudesPrevias.map((s) => s.viaje.viajeId);
    }

    if (req.query.viajeOrigen) {
      filter.viajeOrigen = Number.parseInt(
        req.query.viajeOrigen as string,
      ) as number;
    }
    if (req.query.viajeDestino) {
      filter.viajeDestino = Number.parseInt(
        req.query.viajeDestino as string,
      ) as number;
    }
    if (req.query.mascota) {
      if (req.query.mascota === 'true') {
        // Solo filtramos si el pasajero viaja estrictamente con mascota
        filter.viajeAceptaMascotas = true;
      }
    }
    if (req.query.viajeFecha) {
      filter.viajeFecha = (req.query.viajeFecha as string).substring(0, 10);
    }
    if (req.query.generoConductor && req.query.generoConductor !== '') {
      filter.usuarioConductor = {
        generoUsuario: req.query.generoConductor as string,
      };
    }

    const viajesEncontrados = await em.find(Viaje, filter, {
      populate: ['usuarioConductor', 'vehiculo', 'viajeOrigen', 'viajeDestino'],
    });

    const viajesPosibles = viajesEncontrados.filter(
      (viaje) =>
        !idsYaSolicitados.includes(viaje.viajeId) &&
        viaje.usuarioConductor.idUsuario !== usuarioId,
    );

    res.status(200).json({ data: viajesPosibles });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function CU07SolicitarViaje02(req: Request, res: Response) {
  try {
    const usuario = await em.findOne(Usuario, {
      idUsuario: req.body.validatedData.usuario,
    });

    console.log(req.body.validatedData.viaje);
    const viaje = await em.findOne(Viaje, {
      viajeId: req.body.validatedData.viaje,
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    if (!viaje) {
      return res.status(404).json({ message: 'Viaje no encontrado.' });
    }

    const ahora = new Date();
    const [anio, mes, dia] = viaje.viajeFecha.split('-').map(Number);
    const [horas, minutos] = viaje.viajeHorario.split(':').map(Number);
    const fechaHoraViaje = new Date(anio, mes - 1, dia, horas, minutos, 0, 0);

    fechaHoraViaje.setHours(horas, minutos, 0, 0);

    if (ahora >= fechaHoraViaje) {
      console.log('Ahora:', ahora.toString());
      console.log('FechaHoraViaje:', fechaHoraViaje.toString());

      return res.status(400).json({
        message:
          'No podés solicitar este viaje porque ya ha comenzado o su fecha de salida ya pasó.',
      });
    }
    const solicitudPrevia = await em.findOne(SolicitudViaje, {
      usuario: usuario,
      viaje: viaje,
      estadoSolicitud: { $in: ['pendiente', 'aprobada'] },
    });

    if (solicitudPrevia) {
      return res.status(400).json({
        message: 'Ya has solicitado unirte a este viaje previamente.',
      });
    }

    const datosSolictudViaje = {
      usuario: usuario,
      viaje: viaje,
      solViajeFecha: req.body.validatedData.solViajeFecha,
      estadoSolicitud: req.body.validatedData.estadoSolicitud,
    };

    const solicitudViaje = em.create(SolicitudViaje, datosSolictudViaje);
    await em.flush();

    res.status(201).json({
      message: 'Solicitud de viaje creada con éxito',
      data: solicitudViaje,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function CU08CancelarSolicitudDeViaje(req: Request, res: Response) {
  try {
    const idSolicitud = Number.parseInt(req.params.id as string);

    const solicitud = await em.findOne(
      SolicitudViaje,
      { solViajeId: idSolicitud },
      { populate: ['viaje', 'viaje.viajeDestino'] },
    );

    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    const estadosValidos = [
      EstadoSolicitud.PENDIENTE,
      EstadoSolicitud.APROBADA,
    ];

    if (
      !estadosValidos.includes(solicitud.estadoSolicitud as EstadoSolicitud)
    ) {
      return res.status(400).json({
        message: 'Solo se pueden cancelar solicitudes pendientes o aprobadas',
      });
    }

    if (solicitud.viaje.viajeEstado !== EstadoViaje.PENDIENTE) {
      return res
        .status(400)
        .json({ message: 'El viaje ya no permite cancelar solicitudes' });
    }

    solicitud.estadoSolicitud = EstadoSolicitud.CANCELADA;
    await em.flush();

    res.status(200).json({
      message: 'La solicitud de viaje ha sido cancelada',
      data: {
        destino: solicitud.viaje.viajeDestino.nombre,
        fecha: solicitud.viaje.viajeFecha,
        hora: solicitud.viaje.viajeHorario,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function GetAllSolicitudes(req: Request, res: Response) {
  try {
    const sol = await em.findAll(SolicitudViaje);
    res.json({ data: sol });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function getMisSolicitudes(req: Request, res: Response) {
  try {
    const idUsuario = Number.parseInt(req.params.idUsuario as string);

    const usuario = await em.findOne(Usuario, { idUsuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const solicitudes = await em.find(
      SolicitudViaje,
      { usuario: usuario },
      {
        populate: [
          'viaje',
          'viaje.usuarioConductor',
          'viaje.vehiculo',
          'viaje.viajeOrigen',
          'viaje.viajeDestino',
        ],
        orderBy: { solViajeFecha: 'DESC' },
      },
    );
    res.status(200).json({ data: solicitudes });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function getMisPublicaciones(req: Request, res: Response) {
  try {
    const idUsuario = Number.parseInt(req.params.idUsuario as string);
    const usuario = await em.findOne(Usuario, { idUsuario });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const viajes = await em.find(
      Viaje,
      { usuarioConductor: usuario },
      {
        populate: ['viajeOrigen', 'viajeDestino', 'vehiculo'],
        orderBy: { viajeFecha: 'DESC', viajeHorario: 'DESC' },
      },
    );

    const viajesConOcupacion = await Promise.all(
      viajes.map(async (v) => {
        const cantidadAprobadas = await em.count(SolicitudViaje, {
          viaje: v,
          estadoSolicitud: 'aprobada',
        });
        return {
          ...v,
          solicitudesAprobadas: cantidadAprobadas,
        };
      }),
    );

    res.status(200).json({ data: viajesConOcupacion });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function CUU09AprobarDenegarSolicitudes01(req: Request, res: Response) {
  try {
    const idViaje = Number.parseInt(req.params.id as string);
    const solicitudes = await em.find(
      SolicitudViaje,
      {
        viaje: { viajeId: idViaje },
        estadoSolicitud: EstadoSolicitud.PENDIENTE,
      },
      { populate: ['usuario'] },
    );

    res.status(200).json({ data: solicitudes });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function CUU09AprobarDenegarSolicitudes02(req: Request, res: Response) {
  try {
    const idViaje = Number.parseInt(req.params.id as string);
    const solicitudes = await em.find(
      SolicitudViaje,
      {
        viaje: { viajeId: idViaje },
        estadoSolicitud: {
          $in: [EstadoSolicitud.APROBADA, EstadoSolicitud.DENEGADA],
        },
      },
      { populate: ['usuario'] },
    );

    res.status(200).json({ data: solicitudes });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function CUU09AprobarDenegarSolicitudes03(req: Request, res: Response) {
  try {
    const idSolicitud = Number.parseInt(req.params.id as string);
    const solicitud = await em.findOneOrFail(
      SolicitudViaje,
      {
        solViajeId: idSolicitud,
      },
      { populate: ['viaje', 'usuario', 'viaje.viajeOrigen', 'viaje.viajeDestino'] },
    );

    // Validamos que la solicitud siga pendiente
    if (solicitud.estadoSolicitud !== EstadoSolicitud.PENDIENTE) {
      return res
        .status(400)
        .json({ message: 'La solicitud ya no está pendiente' });
    }

    // Calculamos si hay lugar
    const ocupados = await em.count(SolicitudViaje, {
      viaje: solicitud.viaje,
      estadoSolicitud: EstadoSolicitud.APROBADA,
    });
    if (ocupados >= solicitud.viaje.viajeCantLugares) {
      return res.status(400).json({ message: 'El viaje ya está completo.' });
    }

    em.assign(solicitud, { estadoSolicitud: EstadoSolicitud.APROBADA });

    //cancelar solicitudes del pasajero con la misma fecha, origen y destino
    const solapadas = await em.find(SolicitudViaje, {
      usuario: solicitud.usuario,
      estadoSolicitud: EstadoSolicitud.PENDIENTE,
      solViajeId: { $ne: idSolicitud }, // Que no sea la que estamos aprobando
      viaje: {
        viajeOrigen: solicitud.viaje.viajeOrigen,
        viajeDestino: solicitud.viaje.viajeDestino,
        viajeFecha: solicitud.viaje.viajeFecha
      }
    });

    for (const s of solapadas) {
      s.estadoSolicitud = EstadoSolicitud.CANCELADA;
    }

    //si se llena el viaje, cancelar las demas solicitudes
    if (ocupados + 1 === solicitud.viaje.viajeCantLugares) {
      const restantes = await em.find(SolicitudViaje, {
        viaje: solicitud.viaje,
        estadoSolicitud: EstadoSolicitud.PENDIENTE,
        solViajeId: { $ne: idSolicitud }
      }, { populate: ['usuario'] });

      for (const s of restantes) {
        s.estadoSolicitud = EstadoSolicitud.DENEGADA;
        // Notificamos por mail el rechazo automático por cupo lleno
        await MailService.enviarMailSolicitudViajeDenegada(s.usuario, solicitud.viaje);
      }
    }

    await em.flush();

    await MailService.enviarMailSolicitudViajeAprobada(solicitud.usuario, solicitud.viaje);

    return res
      .status(200)
      .json({ message: 'Solicitud aprobada correctamente' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

async function CUU09AprobarDenegarSolicitudes04(req: Request, res: Response) {
  try {
    const idSolicitud = Number.parseInt(req.params.id as string);
    const solicitud = await em.findOneOrFail(SolicitudViaje, {
      solViajeId: idSolicitud,
    }, { populate: ['usuario', 'viaje', 'viaje.viajeDestino', 'viaje.viajeOrigen'] as any });

    em.assign(solicitud, { estadoSolicitud: EstadoSolicitud.DENEGADA });
    await em.flush();

    await MailService.enviarMailSolicitudViajeDenegada(solicitud.usuario, solicitud.viaje);
    return res
      .status(200)
      .json({ message: 'Solicitud denegada correctamente' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

// para obtener un viaje con la cant de lugares disponibles y mostrarlo en solicitudes-mis-viajes
async function getViajeConDisponibilidad(req: Request, res: Response) {
  try {
    const idViaje = Number(req.params.id);

    const viaje = await em.findOne(Viaje, { viajeId: idViaje });

    if (!viaje) {
      return res.status(404).json({ message: 'Viaje no encontrado' });
    }

    const ocupados = await em.count(SolicitudViaje, {
      viaje: viaje,
      estadoSolicitud: EstadoSolicitud.APROBADA,
    });

    const lugaresDisponibles = viaje.viajeCantLugares - ocupados;

    return res.status(200).json({
      data: {
        ...viaje,
        lugaresDisponibles,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function ComenzarViaje(req: Request, res: Response) {
  try {
    const idViaje = Number.parseInt(req.params.id as string);
    const viaje = await em.findOne(
      Viaje,
      { viajeId: idViaje },
      { populate: ['solicitudes', 'solicitudes.usuario', 'viajeDestino', 'viajeOrigen'] as any },
    );

    if (!viaje) return res.status(404).json({ message: 'Viaje no encontrado' });

    if (viaje.viajeEstado === EstadoViaje.EN_CURSO) {
      return res
        .status(400)
        .json({ message: 'El viaje ya se encuentra en curso' });
    }

    for (let index = 0; index < viaje.solicitudes.length; index++) {
      if (
        viaje.solicitudes[index].estadoSolicitud === EstadoSolicitud.PENDIENTE
      ) {
        viaje.solicitudes[index].estadoSolicitud = EstadoSolicitud.DENEGADA;
        await MailService.enviarMailSolicitudViajeDenegada(
          viaje.solicitudes[index].usuario,
          viaje
        );
      }
    }
    viaje.viajeEstado = EstadoViaje.EN_CURSO;
    await em.flush();

    res.status(200).json({
      message: 'El viaje ha comenzado.',
      nuevoEstado: viaje.viajeEstado,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function CU10FinalizarViaje(req: Request, res: Response) {
  try {
    const idViaje = Number.parseInt(req.params.id as string);
    const viaje = await em.findOne(
      Viaje,
      { viajeId: idViaje },
      {
        populate: ['solicitudes.usuario'],
      },
    );

    if (!viaje) return res.status(404).json({ message: 'Viaje no encontrado' });

    viaje.viajeEstado = 'finalizado';
    await em.flush();

    const pasajerosACalificar = viaje.solicitudes
      .getItems()
      .filter((s) => s.estadoSolicitud === 'Aprobada')
      .map((s) => ({
        idUsuario: s.usuario.idUsuario,
        nombre: s.usuario.nombreUsuario,
        apellido: s.usuario.apellidoUsuario,
      }));

    res.status(200).json({
      message: 'Viaje finalizado con éxito.',
      nuevoEstado: viaje.viajeEstado,
      pasajeros: pasajerosACalificar,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function obtenerViajesSinCalificarPasajero(req: Request, res: Response) {
  try {
    const usuarioId = Number(req.params.usuarioId);

    // Buscamos solicitudes aprobadas en viajes finalizados
    const solicitudes = await em.find(
      SolicitudViaje,
      {
        usuario: { idUsuario: usuarioId },
        estadoSolicitud: 'Aprobada',
        viaje: { viajeEstado: 'finalizado' },
      },
      { populate: ['viaje', 'viaje.usuarioConductor'] as any },
    );

    // Buscamos calificaciones que el pasajero ya hizo para esos viajes
    const calificacionesHechas = await em.find(
      Calificacion,
      {
        usuarioCalificador: { idUsuario: usuarioId },
        calificacionTipo: 'Conductor',
      },
      { populate: ['viaje'] as any },
    );

    const idsViajesYaCalificados = calificacionesHechas.map(
      (c) => c.viaje.viajeId,
    );

    // Pendientes: los que están en solicitudes pero no en calificacionesHechas
    const pendientes = solicitudes
      .filter((s) => !idsViajesYaCalificados.includes(s.viaje.viajeId))
      .map((s) => ({
        viajeId: s.viaje.viajeId,
        idUsuario: s.viaje.usuarioConductor.idUsuario,
        nombre: s.viaje.usuarioConductor.nombreUsuario,
        apellido: s.viaje.usuarioConductor.apellidoUsuario,
      }));

    res.status(200).json(pendientes);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function CU11RegistrarCalificacionViajeComoPasajero(
  req: Request,
  res: Response,
) {
  req.body.tipo = 'Conductor';
  return registrarCalificacionGenerica(req, res);
}

async function obtenerRutasFrecuentesSQL() {
  const query = `
SELECT 
      o.nombre AS nombreOrigen, 
      d.nombre AS nombreDestino, 
      COUNT(*) AS cantidadDeViajes, 
      AVG(v.viaje_precio) AS viajePrecioPromedio
    FROM viaje v
    JOIN localidad o ON v.viaje_origen_id = o.id
    JOIN localidad d ON v.viaje_destino_id = d.id
    WHERE v.viaje_fecha BETWEEN DATE_SUB(NOW(), INTERVAL 30 DAY) AND NOW()
    GROUP BY o.nombre, d.nombre
    ORDER BY cantidadDeViajes DESC
    LIMIT 15;
  `;

  const resultados = await em.getConnection().execute(query);

  const rutas = resultados.map((ruta: any, index: number) => ({
    indice: index + 1,
    nombreOrigen: ruta.nombreOrigen,
    nombreDestino: ruta.nombreDestino,
    cantidadDeViajes: Number(ruta.cantidadDeViajes),
    viajePrecioPromedio: Number(ruta.viajePrecioPromedio),
  }));

  return rutas;
}

async function CUU14InformeDeRutas(req: Request, res: Response) {
  try {
    const rutas = await obtenerRutasFrecuentesSQL();

    res.status(200).json({
      message: 'Informe generado correctamente',
      data: rutas,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

async function obtenerPasajerosViajeRealizado(req: Request, res: Response) {
  try {
    const idViaje = Number.parseInt(req.params.id as string);
    
    const viaje = await em.findOne(Viaje, { viajeId: idViaje }, { populate: ['viajeOrigen', 'viajeDestino', 'solicitudes', 'solicitudes.usuario'] });
    
    if (!viaje) return res.status(404).json({ message: 'Viaje no encontrado' });

    const calificacionesDelConductor = await em.find(Calificacion, {
      viaje: viaje,
      usuarioCalificador: viaje.usuarioConductor ,
      calificacionTipo: 'Pasajero'
    }, { populate: ['usuarioCalificado'] });

    const pasajerosAprobados = viaje.solicitudes
      .getItems()
      .filter((s) => s.estadoSolicitud.toLowerCase() === 'aprobada');

    const resultado = pasajerosAprobados.map(solicitud => {
      const pasajero = solicitud.usuario;
        const calificacionDada = calificacionesDelConductor.find(
          c => c.usuarioCalificado.idUsuario === pasajero.idUsuario
      );

      return {
          idUsuario: pasajero.idUsuario,
          nombre: pasajero.nombreUsuario,
          apellido: pasajero.apellidoUsuario,
          fotoPerfil: pasajero.fotoPerfil ? 'foto_ok' : null, 
          calificacionOtorgada: calificacionDada ? calificacionDada.calificacionValoracionLikert : null 
      };
    });

    res.status(200).json({
      viajeInfo: {
        origen: viaje.viajeOrigen.nombre,
        destino: viaje.viajeDestino.nombre,
        fecha: viaje.viajeFecha,
        horario: viaje.viajeHorario
      },
      pasajeros: resultado
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}



export {
  CU05PublicarViaje,
  CU06CancelarViaje,
  CU07SolicitarViaje01,
  CU07SolicitarViaje02,
  CU08CancelarSolicitudDeViaje,
  GetAllSolicitudes,
  getMisSolicitudes,
  getMisPublicaciones,
  CUU09AprobarDenegarSolicitudes01,
  CUU09AprobarDenegarSolicitudes02,
  CUU09AprobarDenegarSolicitudes03,
  CUU09AprobarDenegarSolicitudes04,
  getViajeConDisponibilidad,
  ComenzarViaje,
  CU10FinalizarViaje,
  CU11RegistrarCalificacionViajeComoPasajero,
  obtenerViajesSinCalificarPasajero,
  CUU14InformeDeRutas,
  obtenerPasajerosViajeRealizado
};