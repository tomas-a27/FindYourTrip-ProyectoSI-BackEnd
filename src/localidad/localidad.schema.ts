import { z } from 'zod';

export const localidadSchema = z.object({
  codPostal: z.string()
    .min(4, "El código postal debe tener al menos 4 caracteres")
    .max(10, "El código postal es demasiado largo"),
  nombre: z.string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre es demasiado largo")
});


export const editarLocalidadSchema = localidadSchema.partial();