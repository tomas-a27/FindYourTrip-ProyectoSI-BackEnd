import {Request, Response, NextFunction} from 'express';
import { Usuario } from "../usuario.entity.js";
import { orm } from "../../shared/db/orm.js";
import { Vehiculo } from '../vehiculo/vehiculo.entity.js';
import jwt from 'jsonwebtoken';

const em = orm.em
em.getRepository(Usuario)

function sanitizeVehiculoInput(req: Request, res: Response, next: NextFunction){
    req.body.sanitizedVehiculoInput = {
        patente: req.body.patente,
        modelo: req.body.modelo,
        cantLugares: Number(req.body.cantLugares),
        color: req.body.color,
        marca: req.body.marca,
        usuario: req.body.usuario
    }

    if (req.body.sanitizedInput.cantLugares <= 0){
        return res.status(400).json({message: 'La cantidad de lugares libres debe ser mayor a 0'})
    }

    Object.keys(req.body.sanitizedInput).forEach((key)=>{
        if(req.body.sanitizedInput[key] === undefined) {
            delete req.body.sanitizedInput[key]
        }
    })

    next()
}

async function CU15CrearVehiculo(req: Request, res: Response) {
    try{
        const camposVehiculo = Object.entries(req.body.sanitizedVehiculoInput);
        for (const [key, value] of camposVehiculo) {
            if (value === undefined || value === null || value === '') {
                return res.status(400).json({ 
                    message: `El campo '${key}' es obligatorio y no puede estar vacío.` 
                });
            }
        }
        const patente = req.body.patente
        const vehiculoRepetido = await em.findOne(Vehiculo, {patente})
        
        if (vehiculoRepetido){
            return res.status(409).json({message: `Ya existe un vehiculo con la patente ${patente}`})
        }

        const vehiculo = em.create(Vehiculo, req.body.sanitizedVehiculoInput)
        await em.flush()
        res.status(201).json({message: 'Se registró el vehiculo exitosamente', data: vehiculo})
    } catch(error:any){
        res.status(500).json({message:error.mesagge})
    }
}
