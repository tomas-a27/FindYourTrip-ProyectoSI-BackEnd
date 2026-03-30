import { Router } from 'express';
import { registrarCalificacionGenerica } from './calificacion.controller.js';

export const calificacionRouter = Router();

// ruta para pasajeros y conductores
calificacionRouter.post('/', registrarCalificacionGenerica);
