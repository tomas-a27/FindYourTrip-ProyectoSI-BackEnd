import { z } from 'zod';
import { TipoDocumento, GeneroUsuario, EstadoConductor } from '../shared/enums.js';

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


export const solicitudConductorSchema = z.object({
  nroLicenciaConductorUsuario: z.string().min(5, "El n° de licencia no es válido"),
  vigenciaLicenciaConductorUsuario: z.coerce.date().refine((date) => !isNaN(date.getTime()), {
    message: "La fecha de vencimiento es obligatoria o el formato es inválido"
  }),
  fotoLicenciaConductorUsuario: z.any().optional(),
  fotoPerfil: z.instanceof(Buffer).optional(),
  vehiculo: z.object({
    marca: z.string().min(1, "La marca es obligatoria"),
    modelo: z.string().min(1, "El modelo es obligatorio"),
    color: z.string().min(1, "El color es obligatorio"),
    patente: z.string()
      .min(6, "La patente debe tener al menos 6 caracteres")
      .transform(val => val.toUpperCase().replace(/\s/g, "")),
    cantLugares: z.coerce.number().int().positive("La cantidad de lugares debe ser mayor a 0")
  })
});


export const loginSchema = z.object({
  email: z.string().email("El formato del email no es válido"),
  contrasenaUsuario: z.string().min(1, "La contraseña es obligatoria")
});


export const aprobacionConductorSchema = z.object({
  estadoConductor: z.nativeEnum(EstadoConductor),
  motivoRechazo: z.string().optional()
});