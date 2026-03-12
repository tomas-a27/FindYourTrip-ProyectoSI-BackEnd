import { Request, Response, NextFunction } from 'express';
import { Usuario } from './usuario.entity.js';
import { orm } from '../shared/db/orm.js';
import { Vehiculo } from './vehiculo.entity.js';
import jwt from 'jsonwebtoken';
import { vehiculoSchema, editarVehiculoSchema } from './vehiculo.schema.js';

const em = orm.em;
em.getRepository(Usuario);

function vehiculoValidator(req: Request, res: Response, next: NextFunction) {
  const schema = req.method === 'POST' ? vehiculoSchema : editarVehiculoSchema;
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const erroresPorCampo = result.error.flatten().fieldErrors;

    return res.status(400).json({
      message: "Error de validación en los datos del vehículo",
      errors: erroresPorCampo
    });
  }

  req.body.validatedData = result.data;
  next();
}

async function CU15CrearVehiculo(req: Request, res: Response) {
  try {
    const idUsuario = Number(req.params.id);
    const usuario = await em.findOne(Usuario, { idUsuario });

    if (!usuario) {
      return res.status(404).json({ message: 'No se encontró el usuario' });
    }

    const data = req.body.validatedData;

    const vehiculoRepetido = await em.findOne(Vehiculo, { patente: data.patente });
    if (vehiculoRepetido) {
      return res.status(409).json({ message: `Ya existe un vehiculo con la patente ${data.patente}` });
    }

    const vehiculo = em.create(Vehiculo, { ...data, usuario });
    await em.flush();

    res.status(201).json({ message: 'Vehiculo agregado con exito', data: vehiculo });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function CU16EditarVehiculo(req: Request, res: Response) {
  const patente = (req.params.patente as string).toUpperCase();
  try {
    const vehiculo = await em.findOneOrFail(Vehiculo, { patente });
    const datosActualizados = req.body.validatedData;

    em.assign(vehiculo, datosActualizados);
    await em.flush();

    res.status(200).json({ message: 'El vehículo se editó correctamente', data: vehiculo });
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ message: `No se encontró el vehículo con patente ${patente}` });
    }
    res.status(500).json({ message: error.message });
  }
}

async function CU17EliminarVehiculo(req: Request, res: Response) {
  try{
    const patente = (req.params.patente as string).toUpperCase();
    const vehiculo = await em.findOne(Vehiculo, {patente});
    if (!vehiculo) {
      return res.status(404).json({message: `No se encuentra el vehiculo con patente ${patente}`})
    }
    await em.remove(vehiculo).flush();
    return res.status(200).json({ message: 'Vehículo eliminado con éxito' })

  } catch(error: any) {
    return res.status(500).json({message: error.mesagge})
  }
}

export { vehiculoValidator, CU15CrearVehiculo, CU16EditarVehiculo,
        CU17EliminarVehiculo
 };
