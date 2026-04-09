import { Request, Response, NextFunction } from 'express';
import { orm } from '../shared/db/orm.js';
import { Localidad } from './localidad.entity.js';
import { localidadSchema, editarLocalidadSchema } from './localidad.schema.js';
import { Viaje } from '../viaje/viaje.entity.js';

const em = orm.em;

function localidadValidator(req: Request, res: Response, next: NextFunction) {
  const schema = req.method === 'POST' ? localidadSchema : editarLocalidadSchema;
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Los datos ingresados no están en el formato correspondiente", // Mensaje según CU021 Paso 2.c
      errors: result.error.flatten().fieldErrors
    });
  }

  req.body.validatedData = result.data;
  next();
}

async function crearLocalidad(req: Request, res: Response) {
  try {
    const data = req.body.validatedData;

    const existe = await em.findOne(Localidad, { codPostal: data.codPostal });
    if (existe) {
      return res.status(400).json({ message: 'Ya existe una localidad con el código postal ingresado.' });
    }

    const localidad = em.create(Localidad, data);
    await em.flush();

    res.status(201).json({
      message: '¡Localidad registrada con éxito!' 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function editarLocalidad(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const localidadToUpdate = await em.findOneOrFail(Localidad, id);
    const data = req.body.validatedData;

    if (data.codPostal && data.codPostal !== localidadToUpdate.codPostal) {
      const another = await em.findOne(Localidad, { codPostal: data.codPostal });
      if (another) {
        return res.status(400).json({
          message: 'Ya existe una localidad con el código postal ingresado.' // Mensaje CU021 Paso 2.d
        });
      }
    }

    em.assign(localidadToUpdate, data);
    await em.flush();

    res.status(200).json({
      message: 'Se editó la localidad con éxito' // Mensaje CU021 Paso 2
    });
  } catch (error: any) {
    res.status(error.name === 'NotFoundError' ? 404 : 500).json({ message: error.message });
  }
}

async function eliminarLocalidad(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const localidadToDelete = await em.findOneOrFail(Localidad, id);

    // Valida si la localidad está en uso en algún Viaje
    const viajeConEstaLocalidad = await em.findOne(Viaje, {
      $or: [
        { viajeOrigen: localidadToDelete },
        { viajeDestino: localidadToDelete }
      ]
    });

    if (viajeConEstaLocalidad) {
      return res.status(400).json({ 
        message: 'No se puede eliminar la localidad porque tiene viajes asociados.' 
      });
    }

    em.remove(localidadToDelete);
    await em.flush();
    
    res.status(200).json({
      message: 'La localidad se eliminó con éxito'
    });
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ message: 'Localidad no encontrada.' });
    }
    res.status(500).json({ message: error.message });
  }
}

async function mostrarLocalidad(req: Request, res: Response) {
  try {
    const localidades = await em.findAll(Localidad);
    res.status(200).json({ message: 'Show localidades', data: localidades });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function getOne(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const localidad = await em.findOne(Localidad, id);
    if (localidad === null) {
      res.status(404).json({ mesagge: 'Localidad not found' });
      return;
    }
    res.status(200).json({ message: 'Mostrar localidad', data: localidad });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
export {
  localidadValidator,
  crearLocalidad,
  mostrarLocalidad,
  editarLocalidad,
  eliminarLocalidad,
  getOne,
};
