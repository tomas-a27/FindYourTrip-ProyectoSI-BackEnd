import { Router } from 'express'
import { sanitizeUsuarioInput, findOne, CU01RegistrarUsuario,
        CU02EditarPasajero, CU03SolicitarPasajeroComoConductor, loginUsuario,
        obtenerConductoresPendientes, CU04AprobarPasajeroComoConductor } from './usuario.controller.js'
import { upload } from '../shared/multer.config.js' // <-- IMPORTAMOS MULTER

export const usuarioRouter = Router()

usuarioRouter.post('/login', loginUsuario)
usuarioRouter.get('/conductoresPendientes', obtenerConductoresPendientes)
usuarioRouter.get('/:id', findOne)
usuarioRouter.post('/', sanitizeUsuarioInput, CU01RegistrarUsuario)

usuarioRouter.put('/solicitarSerConductor/:id', 
upload.fields([{ name: 'fotoPerfil', maxCount: 1 }, { name: 'fotoLicencia', maxCount: 1 }]), 
sanitizeUsuarioInput, 
CU03SolicitarPasajeroComoConductor
)

usuarioRouter.put('/aprobarConductor/:id', sanitizeUsuarioInput, CU04AprobarPasajeroComoConductor)
usuarioRouter.patch('/:id', sanitizeUsuarioInput, CU02EditarPasajero)