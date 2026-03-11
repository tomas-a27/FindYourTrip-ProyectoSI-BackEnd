import { Router } from 'express';
import { CU07SolicitarViaje, CU05PublicarViaje, viajeValidator } from './viaje.controller.js';

export const viajeRouter = Router();

viajeRouter.get('/solicitar', CU07SolicitarViaje);
viajeRouter.post('/', viajeValidator, CU05PublicarViaje);