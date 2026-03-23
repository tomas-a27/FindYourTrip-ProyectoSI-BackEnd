import { Request, Response, NextFunction } from 'express';
import { orm } from '../shared/db/orm.js';
import { Viaje } from './viaje.entity.js';
import { Vehiculo } from '../usuario/vehiculo.entity.js';
import { Usuario } from '../usuario/usuario.entity.js';
import { viajeSchema } from './viaje.schema.js';
import { SolicitudViajeSchema } from './solicitudViaje.schema.js';
import { SolicitudViaje } from './solicitudViaje.entity.js';
import { EstadoSolicitud } from '../shared/enums.js';

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

    if (datosViaje.viajeFecha < hoy) {
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

async function CU07SolicitarViaje01(req: Request, res: Response) {
  try {
    let filter: {
      viajeOrigen?: number;
      viajeDestino?: number;
      viajeFecha?: Date;
      viajeAceptaMascotas?: boolean;
      usuarioConductor?: any;
      viajeEstado?: string;
    } = { viajeEstado: 'Disponible' };

    //Habria que cambiar lo de user id, el lugar donde se obtiene
    const usuarioId = Number.parseInt(req.query.usuarioId as string);

    const usuario = await em.findOne(Usuario, { idUsuario: usuarioId });

    const solicitudesExclude = await em.find(SolicitudViaje, {
      usuario: usuario,
      estadoSolicitud: EstadoSolicitud.PENDIENTE,
    });

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
        filter.viajeAceptaMascotas = true;
      } else filter.viajeAceptaMascotas = false;
    }
    if (req.query.viajeFecha) {
      filter.viajeFecha = new Date(req.query.viajeFecha as string);
    }
    if (req.query.generoConductor && req.query.generoConductor !== '') {
      filter.usuarioConductor = {
        generoUsuario: req.query.generoConductor as string,
      };
    }

    const viajesBrutos = await em.find(Viaje, filter, {
      populate: ['usuarioConductor', 'vehiculo', 'viajeOrigen', 'viajeDestino'],
    });

    console.log('viejesBrutos');
    console.log(viajesBrutos);

    const idsConSolicitud = solicitudesExclude.map((s) => s.viaje.viajeId);

    const viajesPosibles = viajesBrutos.filter(
      (viaje) =>
        !idsConSolicitud.includes(viaje.viajeId) &&
        viaje.usuarioConductor.idUsuario !== usuarioId, // Excluir mis propios viajes
    );

    console.log('viajesPosibles');
    console.log(viajesPosibles);

    res.status(200).json({ data: viajesPosibles });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function CU07SolicitarViaje02(req: Request, res: Response) {
  try {
    console.log('pega back');
    const usuario = await em.findOne(Usuario, {
      idUsuario: req.body.validatedData.usuario,
    });

    const viaje = await em.findOne(Viaje, {
      viajeId: req.body.validatedData.viaje,
    });

    if (!usuario) {
      console.log('Usuario no encontrado.');
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    if (!viaje) {
      return res.status(404).json({ message: 'Viaje no encontrado.' });
      console.log('Viaje no encontrado.');
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
    console.log(error);
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
export {
  CU07SolicitarViaje02,
  CU05PublicarViaje,
  CU07SolicitarViaje01,
  GetAllSolicitudes,
};
