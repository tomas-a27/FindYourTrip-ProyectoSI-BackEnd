import { z } from 'zod';
import { TipoDocumento, GeneroUsuario } from '../shared/enums.js';

export const usuarioSchema = z.object({
  nombreUsuario: z.string().min(1, "El nombre es obligatorio"),
  apellidoUsuario: z.string().min(1, "El apellido es obligatorio"),
  tipoDocumento: z.nativeEnum(TipoDocumento, {
    message: "Seleccione un tipo de documento válido"
  }),
  nroDocumento: z.string().min(7, "Nro. de documento demasiado corto").refine((val) => !isNaN(Number(val)), {
    message: "El número de documento debe ser numérico"
  }),
  telefono: z.string().min(8, "Teléfono inválido").refine((val) => !isNaN(Number(val.replace(/\s/g, ""))), {
    message: "El teléfono debe contener solo números"
  }),
  generoUsuario: z.nativeEnum(GeneroUsuario).optional(),
  email: z.string().email("Formato de email incorrecto"),

  contrasenaUsuario: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").optional(),
  contrasenaUsuarioConfirmacion: z.string().optional(),
  contrasenaUsuarioActual: z.string().optional(),
  tipoUsuario: z.string().optional(),
  estadoUsuario: z.string().optional(),
}).refine((data) => {
  if (data.contrasenaUsuario && data.contrasenaUsuarioConfirmacion) {
    return data.contrasenaUsuario === data.contrasenaUsuarioConfirmacion;
  }
  return true;
}, {
  message: "Las contraseñas no coinciden",
  path: ["contrasenaUsuarioConfirmacion"]
});