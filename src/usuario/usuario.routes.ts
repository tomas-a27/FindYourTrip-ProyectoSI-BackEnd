import {Router} from 'express'
import { sanitizeUsuarioInput, findOne, CU01RegistrarUsuario } from './usuario.controller.js'

export const usuarioRouter = Router()

usuarioRouter.get('/:id', findOne)
usuarioRouter.post('/', sanitizeUsuarioInput, CU01RegistrarUsuario)