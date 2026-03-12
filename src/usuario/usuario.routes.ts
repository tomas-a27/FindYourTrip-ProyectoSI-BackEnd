import { Router } from 'express'
import { 
        usuarioValidator, 
        solicitudConductorValidator, 
        loginValidator,
        aprobarConductorValidator,
        getUsuarioById, 
        CU01RegistrarUsuario,
        CU02EditarPasajero, 
        CU03SolicitarPasajeroComoConductor, 
        loginUsuario,
        obtenerConductoresPendientes, 
        CU04AprobarPasajeroComoConductor 
} from './usuario.controller.js'
import { upload } from '../shared/multer.config.js' 

export const usuarioRouter = Router()

usuarioRouter.post('/login', loginValidator, loginUsuario)
usuarioRouter.get('/conductoresPendientes', obtenerConductoresPendientes)
usuarioRouter.get('/:id', getUsuarioById)
usuarioRouter.post('/', usuarioValidator, CU01RegistrarUsuario)

usuarioRouter.put(
        '/solicitarSerConductor/:id', 
        upload.fields([{ name: 'fotoPerfil', maxCount: 1 }, { name: 'fotoLicencia', maxCount: 1 }]), 
        solicitudConductorValidator, 
        CU03SolicitarPasajeroComoConductor
)

usuarioRouter.put('/aprobarConductor/:id', aprobarConductorValidator, CU04AprobarPasajeroComoConductor)
usuarioRouter.patch('/:id', usuarioValidator, CU02EditarPasajero)