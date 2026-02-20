import {Request, Response, NextFunction} from 'express'
import { orm } from "../shared/db/orm.js";
import { Usuario } from "./usuario.entity.js";

const em = orm.em
em.getRepository(Usuario)

function sanitizeUsuarioInput(req: Request, res: Response, next: NextFunction) {
    req.body.sanitizedInput = {
        tipoUsuario: req.body.tipoUsuario,
        nombreUsuario: req.body.nombreUsuario,
        apellidoUsuario: req.body.apellidoUsuario,
        tipoDocumento: req.body.tipoDocumento,
        nroDocumento: req.body.nroDocumento,
        email: req.body.email,
        telefono: req.body.telefono,
        contrasenaUsuario: Usuario.hashPassword(req.body.contrasenaUsuario),
        generoUsuario: req.body.generoUsuario,
        calificacionPas: req.body.calificacionPas,
        estadoUsuario: req.body.estadoUsuario,
        nroLicenciaConductorUsuario: req.body.nroLicenciaConductorUsuario,
        vigenciaLicenciaConductorUsuario: req.body.vigenciaLicenciaConductorUsuario,
        fotoLicenciaConductorUsuario: req.body.fotoLicenciaConductorUsuario,
        calificacionConductor: req.body.calificacionConductor,
        estadoConductor: req.body.estadoConductor,
        fotoPerfil: req.body.fotoPerfil
    }; 
    
    Object.keys(req.body.sanitizedUsuarioInput).forEach((key)=>{
        if(req.body.sanitizedUsuarioInput[key] === undefined) {
            delete req.body.sanitizedUsuarioInput[key]
        }
    })

    next()
}

async function findOne(req: Request, res: Response) {
    /*try {
        const id = Number.parseInt(req.params.idUsuario)
        const usuario = await em.findOneOrFail(Usuario, {id})
        res
            .status(200)
            .json({message: 'usuario encontrado', data:usuario})
    } catch (error:any) {
        res.status(500).json({message: error.message})
    }*/
   res.status(200)
            .json({message: 'usuario encontrado'})
}

export  { sanitizeUsuarioInput, findOne }