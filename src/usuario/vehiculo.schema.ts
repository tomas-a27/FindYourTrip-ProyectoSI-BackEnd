import { z } from 'zod';

export const vehiculoSchema = z.object({
  patente: z.string()
    .min(6, "La patente debe tener al menos 6 caracteres")
    .transform(val => val.toUpperCase().replace(/\s/g, "")),

  modelo: z.string().min(1, "El modelo es obligatorio"),

  marca: z.string().min(1, "La marca es obligatorio"),

  color: z.string().min(1, "El color es obligatorio"),

  cantLugares: z.coerce.number()
    .int("Debe ser un número entero")
    .positive("La cantidad de lugares debe ser mayor a 0")
});


export const editarVehiculoSchema = vehiculoSchema.partial().omit({ patente: true });