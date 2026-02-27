import { Request, Response, NextFunction } from 'express';
import { orm } from '../shared/db/orm.js';
import { Viaje } from './viaje.entity.js';
import { Vehiculo } from '../usuario/vehiculo.entity.js';

const em = orm.em;

function sanitizeViajeInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    viajeFecha: req.body.viajeFecha,
    viajeHorario: req.body.viajeHorario,
    viajeCantLugares: Number.parseInt(req.body.viajeCantLugares),
    viajeEstado: req.body.viajeEstado || 'Disponible',
    viajeComentario: req.body.viajeComentario,
    viajeAceptaMascotas: req.body.viajeAceptaMascotas,
    viajePrecio: Number.parseFloat(req.body.viajePrecio),
    vehiculo: req.body.vehiculo,
    usuarioConductor: req.body.usuarioConductor,
    viajeOrigen: req.body.viajeOrigen,
    viajeDestino: req.body.viajeDestino,
  };

  if (req.body.sanitizedInput.viajeCantLugares <= 0) {
    return res.status(400).json({ message: 'La cantidad de lugares debe ser mayor a 0' });
  }
//faltan agregar mas validaciones
  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });

  next();
}
async function CU05PublicarViaje(req: Request, res: Response) {
  try {
    const datosViaje = req.body.sanitizedInput;

    const vehiculoDoc = await em.findOne(Vehiculo, { patente: datosViaje.vehiculo });

    if (!vehiculoDoc) {
      return res.status(404).json({ message: 'El vehículo seleccionado no existe.' });
    }

    if (datosViaje.viajeCantLugares > vehiculoDoc.cantLugares) {
      return res.status(400).json({ 
        message: `Error: No podés ofrecer ${datosViaje.viajeCantLugares} lugares porque tu vehículo solo tiene capacidad para ${vehiculoDoc.cantLugares}.` 
      });
    }

    const hoy = new Date();
    if (new Date(datosViaje.viajeFecha) < hoy) {
      return res.status(400).json({ message: 'No podés publicar un viaje con fecha pasada.' });
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
    const viajes = await em.find(Viaje, {
      viajeOrigen: { nombre: { $like: `%${origen || ''}%` } },
      viajeDestino: { nombre: { $like: `%${destino || ''}%` } },
      viajeEstado: 'Disponible'
    }, {
      populate: ['viajeOrigen', 'viajeDestino', 'usuarioConductor', 'vehiculo']
    });
    res.status(200).json({ data: viajes });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export { sanitizeViajeInput, CU07SolicitarViaje, CU05PublicarViaje };