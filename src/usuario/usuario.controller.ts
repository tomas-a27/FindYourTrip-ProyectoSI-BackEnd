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
    
    // Validar campos requeridos
        if (!['DNI', 'Pasaporte', 'LC', 'LE', 'CPI'].includes(req.body.sanitizedInput.tipoDocumento)) {
            return res.status(400).json({
                message: 'Tipo de Documento no válido'
            });
        }

        if (req.body.sanitizedInput.tipoDocumento === 'DNI' && isNaN(Number(req.body.sanitizedInput.nroDocumento)))
            return res.status(400).json({
                message: 'Formato de DNI no válido'});
    //validar mail
        if (!esEmailValido(req.body.sanitizedInput.email)){
            return res.status(400).json({
                message: 'Email no válido'
            })
        }

    Object.keys(req.body.sanitizedInput).forEach((key)=>{
        if(req.body.sanitizedInput[key] === undefined) {
            delete req.body.sanitizedInput[key]
        }
    })

    next()
}

async function findOne(req: Request, res: Response) {
    try {
        const idUsuario = Number.parseInt(req.params.id as string)
        const usuario = await em.findOneOrFail(Usuario, {idUsuario})
        res
            .status(200)
            .json({message: 'usuario encontrado', data:usuario})
    } catch (error:any) {
        if (error.name === 'NotFoundError') {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(500).json({message: error.message})
    }
   
}

async function CU01RegistrarUsuario(req: Request, res: Response) {
     try {
        const userData = req.body.sanitizedInput;

        // Verificar si el usuario ya existe
        const existingUser = await em.findOne(Usuario, {
            $or: [
                { telefono: userData.telefono },
                { email: userData.email },
                {tipoDocumento: userData.tipoDocumento, 
                        nroDocumento: userData.nroDocumento }
            ]
        });
        
        if (existingUser) {
            if (existingUser.email === userData.email) {
                return res.status(409).json({
                    message: 'Este email ya está registrado'
                });
            } else if (existingUser.telefono === userData.telefono) {
                return res.status(409).json({
                    message: 'Ya hay una cuenta asociada a este teléfono'
                });
            } else {
                return res.status(409).json({
                    message: 'Este documento ya está registrado'
                })
            }
        }

        const usuario = em.create(Usuario, userData)
        await em.flush()

        res.status(201).json({ message: 'usuario creado', data: usuario})

    } catch (error: any) {
        res.status(500).json({ message: error.message})
    }

}

async function CU02EditarPasajero(req: Request, res: Response) {
    try {
        const idUsuario = Number.parseInt(req.params.id as string)
        const userData = req.body.sanitizedInput
        
        const usuario = await em.findOneOrFail(Usuario, { idUsuario })

        if (usuario.estadoUsuario === 'inhabilitado') {
            return res.status(403).json({ message: 'Usuario inhabilitado' })
        }

        const camposEditables = [
            'nombreUsuario',
            'apellidoUsuario',
            'generoUsuario',
            'telefono',
            'email',
            'contrasenaUsuario'
        ]

        if (Object.keys(userData).length === 0) {
            return res.status(400).json({ message: 'Debe editar al menos un campo' })
        }

        for (const key of Object.keys(userData)) {
            if (!camposEditables.includes(key)) {
                return res.status(400).json({ message: `El campo ${key} no se puede editar` })
            }

            if (userData[key] === '') {
                return res.status(400).json({ message: `El campo ${key} no puede quedar vacío` })
            }
        }

        if (userData.email && !esEmailValido(userData.email)) {
            return res.status(400).json({ message: 'Email no válido' })
        }

        if (userData.telefono && isNaN(Number(userData.telefono))) {
            return res.status(400).json({ message: 'Teléfono no válido' })
        }

        Object.assign(usuario, userData)
        await em.flush()
        res.status(200).json({ message: 'El campo se actualizó correctamente', data: usuario })

    } catch (error: any) {
        if (error.name === 'NotFoundError') {
            return res.status(404).json({ message: 'Usuario no encontrado' })
        }
        res.status(500).json({ message: error.message })
    }
}

function esEmailValido(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export  { sanitizeUsuarioInput, findOne, CU01RegistrarUsuario, CU02EditarPasajero}