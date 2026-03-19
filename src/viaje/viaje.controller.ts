import { Request, Response, NextFunction } from 'express';
import { orm } from '../shared/db/orm.js';
import { Viaje } from './viaje.entity.js';
import { Vehiculo } from '../usuario/vehiculo.entity.js';
import { Usuario } from '../usuario/usuario.entity.js';
import { viajeSchema } from './viaje.schema.js';

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

async function CU07SolicitarViaje(req: Request, res: Response) {
  try {
    const { origen, destino } = req.query;
    const viajes = await em.find(
      Viaje,
      {
        viajeOrigen: { nombre: { $like: `%${origen || ''}%` } },
        viajeDestino: { nombre: { $like: `%${destino || ''}%` } },
        viajeEstado: 'Disponible',
      },
      {
        populate: [
          'viajeOrigen',
          'viajeDestino',
          'usuarioConductor',
          'vehiculo',
        ],
      },
    );
    res.status(200).json({ data: viajes });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export { CU07SolicitarViaje, CU05PublicarViaje };
