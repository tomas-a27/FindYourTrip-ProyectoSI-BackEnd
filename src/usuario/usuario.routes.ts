import {Router} from 'express'
import { usuarioValidator, getUsuarioById, CU01RegistrarUsuario,
        CU02EditarPasajero, CU03SolicitarPasajeroComoConductor, loginUsuario,
        obtenerConductoresPendientes, CU04AprobarPasajeroComoConductor } from './usuario.controller.js'
import { upload } from '../shared/multer.config.js' // <-- IMPORTAMOS MULTER

export const usuarioRouter = Router()

usuarioRouter.post('/login', loginUsuario)
usuarioRouter.get('/conductoresPendientes', obtenerConductoresPendientes)
usuarioRouter.get('/:id', getUsuarioById)
usuarioRouter.post('/', usuarioValidator, CU01RegistrarUsuario)
usuarioRouter.put('/solicitarSerConductor/:id', usuarioValidator, CU03SolicitarPasajeroComoConductor)
usuarioRouter.put('/aprobarConductor/:id', usuarioValidator, CU04AprobarPasajeroComoConductor)
usuarioRouter.patch('/:id', usuarioValidator, CU02EditarPasajero)