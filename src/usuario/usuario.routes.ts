import {Router} from 'express'
import { sanitizeUsuarioInput, findOne, CU01RegistrarUsuario,
        CU02EditarPasajero, CU03SolicitarPasajeroComoConductor, loginUsuario } from './usuario.controller.js'

export const usuarioRouter = Router()

usuarioRouter.post('/login', loginUsuario)
usuarioRouter.get('/:id', findOne)
usuarioRouter.post('/', sanitizeUsuarioInput, CU01RegistrarUsuario)
usuarioRouter.put('/solicitarSerConductor/:id', sanitizeUsuarioInput, CU03SolicitarPasajeroComoConductor)

usuarioRouter.put('/:id', sanitizeUsuarioInput, CU02EditarPasajero)
