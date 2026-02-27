import { Router } from 'express';
import { CU07SolicitarViaje, CU05PublicarViaje, sanitizeViajeInput } from './viaje.controller.js';

export const viajeRouter = Router();

viajeRouter.get('/solicitar', CU07SolicitarViaje);
viajeRouter.post('/', sanitizeViajeInput, CU05PublicarViaje);