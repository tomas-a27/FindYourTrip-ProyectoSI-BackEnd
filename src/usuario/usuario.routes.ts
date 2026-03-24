import { Router } from 'express'
import { upload } from '../shared/multer.config.js'
import { TipoUsuario } from '../shared/enums.js'
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
  CU04AprobarPasajeroComoConductor ,
  solicitarRecuperacionContrasena,
  restablecerContrasena,
  verifyToken,
  authorizeRoles
} from './usuario.controller.js'

export const usuarioRouter = Router()

//rutas públicas
usuarioRouter.post('/login', loginValidator, loginUsuario)
usuarioRouter.post('/recuperar-contrasena', solicitarRecuperacionContrasena)
usuarioRouter.post('/restablecer-contrasena', restablecerContrasena)
usuarioRouter.post('/', usuarioValidator, CU01RegistrarUsuario)

//rutas protegidas
usuarioRouter.get(
  '/conductoresPendientes',
  verifyToken,
  authorizeRoles([TipoUsuario.ADMINISTRADOR]),
  obtenerConductoresPendientes
)

usuarioRouter.put(
  '/solicitarSerConductor/:id',
  verifyToken,
  upload.fields([{ name: 'fotoPerfil', maxCount: 1 }, { name: 'fotoLicencia', maxCount: 1 }]), 
  solicitudConductorValidator, 
  CU03SolicitarPasajeroComoConductor
)

usuarioRouter.put(
  '/aprobarConductor/:id',
  verifyToken,
  authorizeRoles([TipoUsuario.ADMINISTRADOR]),
  aprobarConductorValidator,
  CU04AprobarPasajeroComoConductor
)

usuarioRouter.put(
  '/:id',
  verifyToken,
  upload.fields([{ name: 'fotoPerfil', maxCount: 1 }]),
  usuarioValidator,
  CU02EditarPasajero
)

usuarioRouter.get(
  '/:id',
  verifyToken,
  getUsuarioById
)