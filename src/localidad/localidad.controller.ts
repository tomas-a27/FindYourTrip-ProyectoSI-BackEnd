import { Request, Response, NextFunction } from 'express';
import { orm } from '../shared/db/orm.js';
import { Localidad } from './localidad.entity.js';
import { error } from 'node:console';

const em = orm.em;

function sanitizeLocalidadInput(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.body.sanitizeLocalidadInput = {
    codPostal: req.body.codPostal,
    nombre: req.body.nombre,
  };

  Object.keys(req.body.sanitizeLocalidadInput).forEach((key) => {
    if (req.body.sanitizeLocalidadInput[key] === undefined) {
      delete req.body.sanitizeLocalidadInput[key];
    }
  });

  next();
}

async function CU19CrearLocalidad(req: Request, res: Response) {
  try {
    const localidad = em.create(Localidad, req.body.sanitizeLocalidadInput);
    await em.flush();
    res
      .status(200)
      .json({ message: 'Localidad registrada con exito', data: localidad });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function showLocalidad(req: Request, res: Response) {
  try {
    const localidades = await em.findAll(Localidad);
    res.status(200).json({ message: 'Show localidades', data: localidades });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export { sanitizeLocalidadInput, CU19CrearLocalidad, showLocalidad };
