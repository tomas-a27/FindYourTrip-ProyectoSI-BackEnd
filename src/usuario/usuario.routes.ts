import {Router} from 'express'
import { sanitizeUsuarioInput, findOne } from './usuario.controler.js'

export const usuarioRouter = Router()

usuarioRouter.get('/:idUsuario', findOne)