import { Router } from 'express';
import {
  obtenerUsuariosASancionar,
  verInfraccionesUsuario,
  desestimarUsuario,
  inhabilitarUsuario
} from './sancion.controller.js';

export const sancionRouter = Router();

sancionRouter.get('/usuarios-a-sancionar', obtenerUsuariosASancionar);
sancionRouter.get('/ver-infracciones/:id', verInfraccionesUsuario);
sancionRouter.post('/desestimar/:id', desestimarUsuario);
sancionRouter.post('/inhabilitar/:id', inhabilitarUsuario);