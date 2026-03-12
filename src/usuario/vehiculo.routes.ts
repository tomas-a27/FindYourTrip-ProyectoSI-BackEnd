import { Router } from 'express'
import { CU15CrearVehiculo, vehiculoValidator, CU16EditarVehiculo, CU17EliminarVehiculo} from './vehiculo.controller.js'
export const vehiculoRouter = Router()

vehiculoRouter.post('/:id', vehiculoValidator, CU15CrearVehiculo)
vehiculoRouter.put('/:patente', vehiculoValidator, CU16EditarVehiculo)
vehiculoRouter.delete('/:patente', CU17EliminarVehiculo)