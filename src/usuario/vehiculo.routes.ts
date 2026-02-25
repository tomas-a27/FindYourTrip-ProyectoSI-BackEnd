import { Router } from 'express'
import { CU15CrearVehiculo, sanitizeVehiculoInput, CU16EditarVehiculo} from './vehiculo.controller.js'
export const vehiculoRouter = Router()

vehiculoRouter.post('/:id', sanitizeVehiculoInput, CU15CrearVehiculo)
vehiculoRouter.put('/:patente', sanitizeVehiculoInput, CU16EditarVehiculo)