import { Router } from 'express';
import {
  crearLocalidad,
  editarLocalidad,
  eliminarLocalidad,
  sanitizeLocalidadInput,
  mostrarLocalidad,
  getOne,
} from './localidad.controller.js';

export const localidadRouter = Router();

localidadRouter.post('/', sanitizeLocalidadInput, crearLocalidad);
localidadRouter.get('/', mostrarLocalidad);
localidadRouter.patch('/:id', sanitizeLocalidadInput, editarLocalidad);
localidadRouter.delete('/:id', eliminarLocalidad);
localidadRouter.get('/:id', getOne);
