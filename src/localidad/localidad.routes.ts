import { Router } from 'express';
import {
  crearLocalidad,
  editarLocalidad,
  eliminarLocalidad,
  localidadValidator,
  mostrarLocalidad,
  getOne,
} from './localidad.controller.js';

export const localidadRouter = Router();

localidadRouter.post('/', localidadValidator, crearLocalidad);
localidadRouter.patch('/:id', localidadValidator, editarLocalidad);
localidadRouter.delete('/:id', eliminarLocalidad);
localidadRouter.get('/', mostrarLocalidad);
localidadRouter.get('/:id', getOne);
