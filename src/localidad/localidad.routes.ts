import { Router } from 'express';
import {
  CU19CrearLocalidad,
  sanitizeLocalidadInput,
  showLocalidad,
} from './localidad.controller.js';

export const localidadRouter = Router();

localidadRouter.post('/', sanitizeLocalidadInput, CU19CrearLocalidad);
localidadRouter.get('/', showLocalidad);
