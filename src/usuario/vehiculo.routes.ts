import { Router } from 'express'
import { vehiculoValidator, mostrarVehiculos, CU15CrearVehiculo, CU16EditarVehiculo, CU17EliminarVehiculo} from './vehiculo.controller.js'
export const vehiculoRouter = Router()

vehiculoRouter.get('/usuario/:id', mostrarVehiculos)
vehiculoRouter.post('/:id', vehiculoValidator, CU15CrearVehiculo)
vehiculoRouter.put('/:patente', vehiculoValidator, CU16EditarVehiculo)
vehiculoRouter.delete('/:patente', CU17EliminarVehiculo)