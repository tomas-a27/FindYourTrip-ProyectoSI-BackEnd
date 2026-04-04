import { Request, Response, NextFunction } from 'express';
import { orm } from '../shared/db/orm.js';
import { wrap } from '@mikro-orm/core';
import { Usuario } from './usuario.entity.js';
import {
  TipoDocumento,
  EstadoUsuario,
  EstadoConductor,
  TipoUsuario,
} from '../shared/enums.js';
import { Vehiculo } from './vehiculo.entity.js';
import jwt from 'jsonwebtoken';
import {
  usuarioSchema,
  solicitudConductorSchema,
  loginSchema,
  aprobacionConductorSchema,
} from './usuario.schema.js';
import { MailService } from '../shared/notifications.js';

const em = orm.em;
em.getRepository(Usuario);

interface JwtPayload {
  idUsuario: number;
  tipoUsuario: TipoUsuario;
}

function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

function authorizeRoles(roles: TipoUsuario[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user || !roles.includes(user.tipoUsuario)) {
      return res.status(403).json({ message: 'No tenés permisos' });
    }

    next();
  };
}

function usuarioValidator(req: Request, res: Response, next: NextFunction) {
  let bufferPerfil: Buffer | undefined;

  if (req.files) {
    const archivos = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    if (archivos.fotoPerfil) {
      bufferPerfil = archivos.fotoPerfil[0].buffer;
    }
  }

  const result = usuarioSchema.safeParse(req.body);

  /*
  if (!result.success) {
    return res.status(400).json({
      message: "Error: El número de documento, teléfono o email no están en el formato correcto",
      errors: result.error.format()
    });
  }
  */

  if (!result.success) {
    const mensajes = result.error.issues.map((issue) => ({
      campo: issue.path.join('.'),
      mensaje: issue.message,
    }));
    const mensajesTexto = mensajes.map((e) => e.mensaje).join(', ');

    return res.status(400).json({
      message: `Error de validación: ${mensajesTexto}`,
    });
  }

  const data = result.data;
  // hasheo de contraseñas
  if (data.contrasenaUsuario) {
    data.contrasenaUsuario = Usuario.hashPassword(data.contrasenaUsuario);
  }
  if (data.contrasenaUsuarioActual) {
    data.contrasenaUsuarioActual = Usuario.hashPassword(
      data.contrasenaUsuarioActual,
    );
  }

  req.body.validatedData = data;

  if (bufferPerfil) {
    req.body.validatedData.fotoPerfil = bufferPerfil;
  }

  next();
}

async function CU01RegistrarUsuario(req: Request, res: Response) {
  try {
    const userData = req.body.validatedData;

    const existingUsers = await em.find(Usuario, {
      $or: [
        { telefono: userData.telefono },
        { email: userData.email },
        {
          tipoDocumento: userData.tipoDocumento,
          nroDocumento: userData.nroDocumento,
        },
      ],
    });
    
    if (existingUsers.length > 0) {
      const conflictos: string[] = [];
      for (const existingUser of existingUsers) {
        if (existingUser.email === userData.email && !conflictos.includes('email')) conflictos.push('email');
        if (existingUser.telefono === userData.telefono && !conflictos.includes('teléfono')) conflictos.push('teléfono');
        if (existingUser.tipoDocumento === userData.tipoDocumento && existingUser.nroDocumento === userData.nroDocumento && !conflictos.includes('documento')) conflictos.push('documento');
      }
      
      const conflictoMsg = conflictos.join(', ').replace(/, ([^,]*)$/, ' y $1');
      
      return res.status(409).json({
        message: `Los siguientes datos ya se encuentran registrados en el sistema: ${conflictoMsg}`,
      });
    }

    userData.estadoUsuario = EstadoUsuario.HABILITADO;
    userData.tipoUsuario = TipoUsuario.PASAJERO;

    const usuario = em.create(Usuario, userData);
    await em.flush();

    res.status(201).json({ message: 'El registro fue exitoso', data: usuario });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function CU02EditarPasajero(req: Request, res: Response) {
  try {
    const userFromToken = (req as any).user;
    const idUsuario = Number(req.params.id);
    const usuarioToUpdate = await em.findOneOrFail(
      Usuario,
      { idUsuario },
      { populate: ['contrasenaUsuario'] },
    );

    if (
      userFromToken.idUsuario !== idUsuario &&
      userFromToken.tipoUsuario !== TipoUsuario.ADMINISTRADOR
    ) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    if (usuarioToUpdate.estadoUsuario === EstadoUsuario.INHABILITADO) {
      return res.status(403).json({ message: 'Usuario inhabilitado' });
    }

    const { validatedData } = req.body;

    if (
      validatedData.contrasenaUsuario &&
      usuarioToUpdate.contrasenaUsuario !==
        validatedData.contrasenaUsuarioActual
    ) {
      return res.status(401).json({ message: 'Contraseña actual incorrecta' });
    }

    if (
      'vigenciaLicenciaConductorUsuario' in validatedData ||
      'fotoPerfil' in validatedData
    ) {
      if (usuarioToUpdate.tipoUsuario !== TipoUsuario.CONDUCTOR) {
        return res
          .status(403)
          .json({ message: 'Solo los conductores pueden editar estos campos' });
      }
    }

    em.assign(usuarioToUpdate, validatedData);
    await em.flush();
    res.status(200).json({
      message: 'El campo se actualizó correctamente',
      data: usuarioToUpdate,
    });
  } catch (error: any) {
    res
      .status(error.name === 'NotFoundError' ? 404 : 500)
      .json({ message: error.message });
  }
}

async function getUsuarioById(req: Request, res: Response) {
  try {
    const userFromToken = (req as any).user;
    const idUsuario = Number.parseInt(req.params.id as string);

    if (
      userFromToken.idUsuario !== idUsuario &&
      userFromToken.tipoUsuario !== TipoUsuario.ADMINISTRADOR
    ) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const usuario = await em.findOneOrFail(
      Usuario,
      { idUsuario },
      { populate: ['vehiculos'] },
    );
    res.status(200).json({ message: 'usuario encontrado', data: usuario });
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(500).json({ message: error.message });
  }
}

function solicitudConductorValidator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (typeof req.body.vehiculo === 'string') {
    try {
      req.body.vehiculo = JSON.parse(req.body.vehiculo);
    } catch (e) {
      console.error('Error al parsear el vehiculo JSON', e);
    }
  }

  // 1. Guardamos los buffers en variables temporales
  let bufferPerfil: Buffer | undefined;
  let bufferLicencia: Buffer | undefined;

  // Si Multer capturó archivos
  if (req.files) {
    const archivos = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };
    if (archivos.fotoPerfil) {
      bufferPerfil = archivos.fotoPerfil[0].buffer;
      req.body.fotoPerfil = 'foto_ok'; // texto temporal para engañar a zod
    }
    if (archivos.fotoLicencia) {
      bufferLicencia = archivos.fotoLicencia[0].buffer;
      req.body.fotoLicenciaConductorUsuario = 'foto_ok'; // texto temporal
    }
  }

  const result = solicitudConductorSchema.safeParse(req.body);
  /*
  if (!result.success) {
    const erroresDetallados = result.error.flatten().fieldErrors;

    return res.status(400).json({
      message:
        'No se ingresaron todos los datos o los formatos son incorrectos',
      detalles: erroresDetallados,
    });
  }*/

  if (!result.success) {
    const mensajes = result.error.issues.map((issue) => ({
      campo: issue.path.join('.'),
      mensaje: issue.message,
    }));
    const mensajesTexto = mensajes.map((e) => e.mensaje).join(', ');

    return res.status(400).json({
      message: `Error de validación: ${mensajesTexto}`,
    });
  }

  req.body.validatedData = result.data;
  if (bufferPerfil) req.body.validatedData.fotoPerfil = bufferPerfil;
  if (bufferLicencia)
    req.body.validatedData.fotoLicenciaConductorUsuario = bufferLicencia;

  next();
}
async function CU03SolicitarPasajeroComoConductor(req: Request, res: Response) {
  try {
    const userFromToken = (req as any).user;
    const idUsuario = Number.parseInt(req.params.id as string);
    const usuario = await em.findOne(Usuario, { idUsuario });

    if (userFromToken.idUsuario !== idUsuario) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    if (!usuario) {
      return res.status(404).json({ message: 'No se encontro el usuario' });
    }

    if (usuario.estadoUsuario === 'inhabilitado') {
      return res
        .status(403)
        .json({ message: 'El usuario se encuentra inhabilitado' });
    }

    if (usuario.estadoConductor === EstadoConductor.APROBADO) {
      return res.status(409).json({ message: 'El usuario ya es un conductor' });
    }
    if (usuario.estadoConductor === EstadoConductor.PENDIENTE) {
      return res
        .status(409)
        .json({ message: 'El usuario ya tiene una solicitud pendiente' });
    }

    const { vehiculo, ...datosLicencia } = req.body.validatedData;

    const vehiculoRepetido = await em.findOne(Vehiculo, {
      patente: vehiculo.patente,
    });
    if (vehiculoRepetido) {
      return res.status(409).json({
        message: `Ya existe un vehiculo registrado con la patente ${vehiculo.patente}`,
      });
    }

    wrap(usuario).assign({
      ...datosLicencia,
      estadoConductor: EstadoConductor.PENDIENTE,
    });

    const nuevoVehiculo = em.create(Vehiculo, {
      ...vehiculo,
      usuario: usuario,
    });

    await em.flush();

    return res.status(200).json({
      message:
        'Hemos enviado su solicitud para ser conductor. Proximamente se le informará si fue aceptada',
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

async function obtenerConductoresPendientes(req: Request, res: Response) {
  try {
    const usuarios = await em.find(Usuario, {
      estadoConductor: EstadoConductor.PENDIENTE,
    });
    res.status(200).json({
      message: 'Buscar usuarios con solicitud para ser conductores pendiente',
      data: usuarios,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export function aprobarConductorValidator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const result = aprobacionConductorSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message:
        "El estado enviado no es válido. Debe ser 'aprobado' o 'denegado'.",
      detalles: result.error.flatten().fieldErrors,
    });
  }

  req.body.validatedData = result.data;
  next();
}

async function CU04AprobarPasajeroComoConductor(req: Request, res: Response) {
  try {
    const idUsuario = Number.parseInt(req.params.id as string);
    const usuario = await em.findOneOrFail(Usuario, { idUsuario });

    if (usuario.estadoConductor !== EstadoConductor.PENDIENTE) {
      return res.status(409).json({
        message: 'El usuario no tiene ninguna solicitud de conductor pendiente',
      });
    }

    const { estadoConductor } = req.body.validatedData;

    // cambiamos el tipo de usuario
    if (estadoConductor === EstadoConductor.APROBADO) {
      usuario.tipoUsuario = TipoUsuario.CONDUCTOR;

    } else if (estadoConductor === EstadoConductor.DENEGADO) {
      usuario.nroLicenciaConductorUsuario = undefined;
      usuario.vigenciaLicenciaConductorUsuario = undefined;
      usuario.fotoLicenciaConductorUsuario = undefined;
      const vehiculos = await em.find(Vehiculo, { usuario: usuario });
      for (const v of vehiculos) {
        em.remove(v);
      }
      await em.flush();
    }

    // Actualizamos el estado del trámite
    usuario.estadoConductor = estadoConductor;

    await em.flush();

    MailService.enviarMailSolicitudParaSerConductor(
      usuario,
      estadoConductor
    ).catch((err) => console.error('Error asincrónico al enviar mail:', err));

    res.status(200).json({
      message: `La solicitud ha sido ${estadoConductor} correctamente`,
      data: usuario,
    });
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ message: 'No se encontró el usuario' });
    }
    res.status(500).json({ message: error.message });
  }
}

function loginValidator(req: Request, res: Response, next: NextFunction) {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      message: 'Email o contraseña con formato incorrecto',
      errors: result.error.format(),
    });
  }
  req.body.validatedData = result.data;
  next();
}

async function loginUsuario(req: Request, res: Response) {
  try {
    const { email, contrasenaUsuario } = req.body.validatedData;

    const usuario = await em.findOne(
      Usuario,
      { email },
      { populate: ['contrasenaUsuario'] },
    );

    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (usuario.estadoUsuario === EstadoUsuario.INHABILITADO) {
      return res
        .status(403)
        .json({ message: 'Usuario inhabilitado por el administrador' });
    }

    const contrasenaHasheada = Usuario.hashPassword(contrasenaUsuario);

    if (usuario.contrasenaUsuario !== contrasenaHasheada) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      console.error('ERROR CRÍTICO: Falta JWT_SECRET en el archivo .env');
      return res
        .status(500)
        .json({ message: 'Error de configuración en el servidor' });
    }

    const token = jwt.sign(
      { idUsuario: usuario.idUsuario, tipoUsuario: usuario.tipoUsuario },
      secretKey,
      { expiresIn: '2h' },
    );

    res.status(200).json({
      message: 'Login exitoso',
      token: token,
      data: {
        idUsuario: usuario.idUsuario,
        nombre: usuario.nombreUsuario,
        apellido: usuario.apellidoUsuario,
        email: usuario.email,
        tipoUsuario: usuario.tipoUsuario,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function solicitarRecuperacionContrasena(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requerido' });

    const usuario = await em.findOne(Usuario, { email });
    if (!usuario) {
      return res
        .status(200)
        .json({ message: 'Si el correo existe, se ha enviado un código' });
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expira = new Date();
    expira.setMinutes(expira.getMinutes() + 45);

    usuario.codigoRecuperacion = codigo;
    usuario.expiracionCodigo = expira;
    await em.flush();

    await MailService.enviarMailCodigoRecuperacion(usuario, codigo);

    res
      .status(200)
      .json({ message: 'Si el correo existe, se ha enviado un código' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function restablecerContrasena(req: Request, res: Response) {
  try {
    const { email, codigo, nuevaContrasena } = req.body;

    if (!email || !codigo || !nuevaContrasena) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }

    const usuario = await em.findOne(Usuario, { email });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (usuario.codigoRecuperacion !== codigo) {
      return res.status(400).json({ message: 'Código incorrecto' });
    }
    if (!usuario.expiracionCodigo || new Date() > usuario.expiracionCodigo) {
      return res
        .status(400)
        .json({ message: 'El código ha expirado. Solicite uno nuevo.' });
    }
    // Actualizar contraseña
    usuario.contrasenaUsuario = Usuario.hashPassword(nuevaContrasena);
    // Limpiar el código usado
    usuario.codigoRecuperacion = undefined;
    usuario.expiracionCodigo = undefined;

    await em.flush();

    res.status(200).json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function obtenerInformeConductores(req: Request, res: Response) {
  try {

    const conductores = await em.find(
      Usuario,
      {
        tipoUsuario: TipoUsuario.CONDUCTOR,
        estadoConductor: EstadoConductor.APROBADO,
      },
      {
        //Ordenamos por calificación de mayor a menor (DESC)
        orderBy: { calificacionConductor: 'DESC NULLS LAST' },
        fields: [
          'nroLicenciaConductorUsuario',
          'nombreUsuario',
          'apellidoUsuario',
          'calificacionConductor',
        ],
      }
    );

    res.status(200).json({
      message: 'Informe de conductores generado exitosamente',
      data: conductores,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export {
  usuarioValidator,
  solicitudConductorValidator,
  loginValidator,
  getUsuarioById,
  CU01RegistrarUsuario,
  CU02EditarPasajero,
  CU03SolicitarPasajeroComoConductor,
  obtenerConductoresPendientes,
  loginUsuario,
  CU04AprobarPasajeroComoConductor,
  solicitarRecuperacionContrasena,
  restablecerContrasena,
  obtenerInformeConductores,
  verifyToken,
  authorizeRoles,
};
