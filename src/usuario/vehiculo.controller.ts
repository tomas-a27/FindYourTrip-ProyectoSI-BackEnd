import { Request, Response, NextFunction } from 'express';
import { Usuario } from './usuario.entity.js';
import { orm } from '../shared/db/orm.js';
import { Vehiculo } from './vehiculo.entity.js';
import jwt from 'jsonwebtoken';

const em = orm.em;
em.getRepository(Usuario);

function sanitizeVehiculoInput(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.body.sanitizedVehiculoInput = {
    patente: req.body.patente?.toUpperCase(),
    modelo: req.body.modelo,
    cantLugares: Number.parseInt(req.body.cantLugares),
    color: req.body.color,
    marca: req.body.marca,
    usuario: req.body.usuario,
  };

  if (req.body.sanitizedVehiculoInput.cantLugares <= 0) {
    return res
      .status(400)
      .json({ message: 'La cantidad de lugares libres debe ser mayor a 0' });
  }

  Object.keys(req.body.sanitizedVehiculoInput).forEach((key) => {
    if (req.body.sanitizedVehiculoInput[key] === undefined) {
      delete req.body.sanitizedVehiculoInput[key];
    }
  });

  next();
}

async function CU15CrearVehiculo(req: Request, res: Response) {
  try {
    const camposVehiculo = Object.entries(req.body.sanitizedVehiculoInput);
    for (const [key, value] of camposVehiculo) {
      if (value === undefined || value === null || value === '') {
        return res.status(400).json({
          message: `El campo '${key}' es obligatorio y no puede estar vacío.`,
        });
      }
    }
    const idUsuario = Number(req.params.id);
    const usuario = await em.findOne(Usuario, { idUsuario });
    if (!usuario) {
      return res.status(404).json({ message: 'No se encontro el usuario' });
    }
    req.body.sanitizedVehiculoInput.usuario = usuario;

    const patente = req.body.patente;
    const vehiculoRepetido = await em.findOne(Vehiculo, { patente });

    if (vehiculoRepetido) {
      return res
        .status(409)
        .json({ message: `Ya existe un vehiculo con la patente ${patente}` });
    }

    const vehiculo = em.create(Vehiculo, req.body.sanitizedVehiculoInput);
    await em.flush();
    res.status(201).json({
      message: 'Se registró el vehiculo exitosamente',
      data: vehiculo,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.mesagge });
  }
}

async function CU16EditarVehiculo(req: Request, res: Response) {
  const patente = (req.params.patente as string).toUpperCase();
  try {
    const vehiculo = await em.findOneOrFail(Vehiculo, { patente });

    const vehiculoActualizado = req.body.sanitizedVehiculoInput;
    const {
      patente: patenteIgnorada,
      usuario: usuarioIgnorado,
      ...datosParaActualizar
    } = req.body.sanitizedVehiculoInput;
    em.assign(vehiculo, datosParaActualizar);
    await em.flush();
    res
      .status(200)
      .json({ message: 'vehiculo actualizado con exito', data: vehiculo });
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return res
        .status(404)
        .json({ message: `No se encontró el vehículo con patente ${patente}` });
    }
    res.status(500).json({ message: error.message });
  }
}

export { sanitizeVehiculoInput, CU15CrearVehiculo, CU16EditarVehiculo };
