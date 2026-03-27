import { z } from 'zod';
import { EstadoViaje } from '../shared/enums.js';

export const viajeSchema = z
  .object({
    viajeFecha: z.coerce.date().refine((val) => !isNaN(val.getTime()), {
      message: 'La fecha es inválida o obligatoria',
    }),
    viajeHorario: z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        'Formato de hora inválido (HH:mm)',
      ),
    viajeCantLugares: z.coerce
      .number()
      .int()
      .min(1, 'Debe haber al menos 1 lugar'),
    viajePrecio: z.coerce.number().positive('El precio debe ser mayor a 0'),
    viajeAceptaMascotas: z.coerce.boolean(),
    viajeEstado: z.nativeEnum(EstadoViaje).default(EstadoViaje.PENDIENTE),
    viajeComentario: z.string().optional().or(z.literal('')),
    // Relaciones
    vehiculo: z.string().min(1, 'La patente del vehículo es obligatoria'),
    usuarioConductor: z.coerce.number(),
    viajeOrigen: z.coerce.number('La localidad origen debe ser un id numerico'),
    viajeDestino: z.coerce.number(
      'La localidad destino debe ser un id numerico',
    ),
  })
  .refine((data) => data.viajeOrigen !== data.viajeDestino, {
    message: 'El origen y el destino no pueden ser iguales',
    path: ['viajeDestino'],
  });
