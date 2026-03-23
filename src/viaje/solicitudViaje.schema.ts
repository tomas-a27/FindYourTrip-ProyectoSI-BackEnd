import { z } from 'zod';
import { EstadoSolicitud } from '../shared/enums.js';

export const SolicitudViajeSchema = z.object({
  solViajeFecha: z.date().default(new Date()),
  estadoSolicitud: z.string().default(EstadoSolicitud.PENDIENTE),
  usuario: z.coerce.number('El id del usuario debe ser numérico'),
  viaje: z.coerce.number('El id del viaje debe ser numérico'),
});
