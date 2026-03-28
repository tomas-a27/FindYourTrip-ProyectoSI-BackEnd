import { Router } from 'express';
import {
  viajeValidator,
  CU05PublicarViaje,
  CU06CancelarViaje,
  CU07SolicitarViaje01,
  CU07SolicitarViaje02,
  CU08CancelarSolicitudDeViaje,
  solicitudViajeValidator,
  GetAllSolicitudes,
  getMisSolicitudes,
  getMisPublicaciones,
  CUU09AprobarDenegarSolicitudes01,
  CUU09AprobarDenegarSolicitudes02,
  CUU09AprobarDenegarSolicitudes03,
  CUU09AprobarDenegarSolicitudes04,
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
viajeRouter.patch('/cancelar/:id', CU06CancelarViaje);
viajeRouter.patch('/cancelar-solicitud/:id', CU08CancelarSolicitudDeViaje);
viajeRouter.get('/mis-solicitudes/:idUsuario', getMisSolicitudes);
viajeRouter.get('/mis-publicaciones/:idUsuario', getMisPublicaciones);
viajeRouter.get(
  '/solicitudes-pendientes-viaje/:id',
  CUU09AprobarDenegarSolicitudes01,
);
viajeRouter.get(
  '/solicitudes-aprobadas-rechazadas-viaje/:id',
  CUU09AprobarDenegarSolicitudes02,
);
viajeRouter.patch(
  '/solicitudes-aprobadas-rechazadas-viaje-aprobar/:id',
  CUU09AprobarDenegarSolicitudes03,
);

viajeRouter.patch(
  '/solicitudes-aprobadas-rechazadas-viaje-denegar/:id',
  CUU09AprobarDenegarSolicitudes04,
);
viajeRouter.get('/solicitudes', GetAllSolicitudes);

viajeRouter.get('/solicitudes', GetAllSolicitudes);
