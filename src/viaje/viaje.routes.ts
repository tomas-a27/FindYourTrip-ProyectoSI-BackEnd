import { Router } from 'express';
import {
  CU07SolicitarViaje02,
  CU05PublicarViaje,
  viajeValidator,
  CU07SolicitarViaje01,
  solicitudViajeValidator,
  GetAllSolicitudes,
  getMisSolicitudes,
  getMisPublicaciones,
} from './viaje.controller.js';
import { verifyToken } from '../usuario/usuario.controller.js';


import { vi } from 'zod/locales';

export const viajeRouter = Router();

viajeRouter.get('/solicitar', CU07SolicitarViaje02);
viajeRouter.post('/', viajeValidator, CU05PublicarViaje);
viajeRouter.get('/mostrar-viaje', CU07SolicitarViaje01);
viajeRouter.post(
  '/solicitar-viaje',
  solicitudViajeValidator,
  CU07SolicitarViaje02,
);
viajeRouter.get('/mis-solicitudes/:idUsuario', getMisSolicitudes);
viajeRouter.get('/mis-publicaciones/:idUsuario', getMisPublicaciones);


viajeRouter.get('/solicitudes', GetAllSolicitudes);
