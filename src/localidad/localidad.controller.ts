import { Request, Response, NextFunction } from 'express';
import { orm } from '../shared/db/orm.js';
import { Localidad } from './localidad.entity.js';

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

async function crearLocalidad(req: Request, res: Response) {
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

async function editarLocalidad(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const localidadToUpdate = await em.findOneOrFail(Localidad, id);

    if (
      req.body.sanitizeLocalidadInput.codPostal &&
      req.body.sanitizeLocalidadInput.codPostal !== localidadToUpdate.codPostal
    ) {
      // Verificar que no exista otra localidad con ese código
      const anotherLocalidad = await em.findOne(Localidad, {
        codPostal: req.body.sanitizeLocalidadInput.codPostal,
      });
      if (anotherLocalidad) {
        res
          .status(400)
          .json({ message: 'Ya existe una localidad con ese codigo' });
        return;
      }
    }
    em.assign(localidadToUpdate, req.body.sanitizeLocalidadInput);
    await em.flush();
    res.status(200).json({ message: 'Localidad editada con éxito' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function eliminarLocalidad(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const localidadToDelete = await em.findOneOrFail(Localidad, id);

    em.remove(localidadToDelete);
    await em.flush();
    res.status(200).json({
      message: 'Localidad eliminada con éxito',
      data: localidadToDelete,
    });
  } catch (error: any) {
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
  sanitizeLocalidadInput,
  crearLocalidad,
  mostrarLocalidad,
  editarLocalidad,
  eliminarLocalidad,
  getOne,
};
