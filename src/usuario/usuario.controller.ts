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
import { usuarioSchema, solicitudConductorSchema } from './usuario.schema.js';

const em = orm.em;
em.getRepository(Usuario);

function usuarioValidator(req: Request, res: Response, next: NextFunction) {
  const result = usuarioSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Error: El número de documento, teléfono o email no están en el formato correcto",
      errors: result.error.format()
    });
  }

  const data = result.data;
  // hasheo de contraseñas
  if (data.contrasenaUsuario) {
    data.contrasenaUsuario = Usuario.hashPassword(data.contrasenaUsuario);
  }
  if (data.contrasenaUsuarioActual) {
    data.contrasenaUsuarioActual = Usuario.hashPassword(data.contrasenaUsuarioActual);
  }

  req.body.validatedData = data;
  next();
}

async function CU01RegistrarUsuario(req: Request, res: Response) {
  try {
    const userData = req.body.validatedData;

    const existingUser = await em.findOne(Usuario, {
      $or: [
        { telefono: userData.telefono },
        { email: userData.email },
        { tipoDocumento: userData.tipoDocumento, nroDocumento: userData.nroDocumento },
      ],
    });
    if (existingUser) {
      return res.status(409).json({
        message: "Ya existe un usuario registrado con ese email, ese teléfono o ese tipo y número de documento"
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
    const idUsuario = Number(req.params.id);
    const usuarioToUpdate = await em.findOneOrFail(Usuario, { idUsuario }, { populate: ['contrasenaUsuario'] });

    if (usuarioToUpdate.estadoUsuario === EstadoUsuario.INHABILITADO) {
      return res.status(403).json({ message: 'Usuario inhabilitado' });
    }

    const { validatedData } = req.body;

    if (validatedData.contrasenaUsuario && (usuarioToUpdate.contrasenaUsuario !== validatedData.contrasenaUsuarioActual)) {
      return res.status(401).json({ message: 'Contraseña actual incorrecta' });
    }

    em.assign(usuarioToUpdate, validatedData);
    await em.flush();
    res.status(200).json({ message: 'El campo se actualizó correctamente', data: usuarioToUpdate });
  } catch (error: any) {
    res.status(error.name === 'NotFoundError' ? 404 : 500).json({ message: error.message });
  }
}


async function getUsuarioById(req: Request, res: Response) {
  try {
    const idUsuario = Number.parseInt(req.params.id as string);
    const usuario = await em.findOneOrFail(Usuario, { idUsuario });
    res.status(200).json({ message: 'usuario encontrado', data: usuario });
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(500).json({ message: error.message });
  }
}

export function solicitudConductorValidator(req: Request, res: Response, next: NextFunction) {
  const result = solicitudConductorSchema.safeParse(req.body);

  if (!result.success) {
    // Obtenemos los errores específicos por campo para ayudar al usuario
    const erroresDetallados = result.error.flatten().fieldErrors;

    return res.status(400).json({
      // Mensaje general del Paso 2.b y 2.c del CU03
      message: "No se ingresaron todos los datos o los formatos son incorrectos",
      detalles: erroresDetallados
    });
  }

  req.body.validatedData = result.data;
  next();
}

async function CU03SolicitarPasajeroComoConductor(req: Request, res: Response) {
  try {
    const idUsuario = Number.parseInt(req.params.id as string);
    const usuario = await em.findOne(Usuario, { idUsuario });

    if (!usuario) {
      return res.status(404).json({ message: 'No se encontro el usuario' });
    }

    // --- PRECONDICIONES (CU03) ---
    // El pasajero debe estar habilitado [cite: 6]
    if (usuario.estadoUsuario === 'inhabilitado') {
      return res.status(403).json({ message: "El usuario se encuentra inhabilitado" });
    }

    // Validar si ya es conductor o tiene trámite pendiente
    if (usuario.estadoConductor === EstadoConductor.APROBADO) {
      return res.status(409).json({ message: 'El usuario ya es un conductor' });
    }
    if (usuario.estadoConductor === EstadoConductor.PENDIENTE) {
      return res.status(409).json({ message: 'El usuario ya tiene una solicitud pendiente' });
    }

    // Obtenemos los datos ya validados por Zod
    const { vehiculo, ...datosLicencia } = req.body.validatedData;

    // --- VALIDACIÓN DE NEGOCIO ---
    // Verificar si la patente ya existe en el sistema
    const vehiculoRepetido = await em.findOne(Vehiculo, { patente: vehiculo.patente });
    if (vehiculoRepetido) {
      return res.status(409).json({
        message: `Ya existe un vehiculo registrado con la patente ${vehiculo.patente}`
      });
    }

    // --- REGISTRO DE SOLICITUD (Paso 2) ---
    // Actualizamos al Usuario con sus datos de licencia y estado "pendiente" [cite: 35, 46]
    wrap(usuario).assign({
      ...datosLicencia,
      estadoConductor: EstadoConductor.PENDIENTE
    });

    // Creamos la nueva entidad Vehículo asociada al usuario 
    const nuevoVehiculo = em.create(Vehiculo, {
      ...vehiculo,
      usuario: usuario
    });

    await em.flush();

    // Mensaje de éxito final según el PDF [cite: 39]
    return res.status(200).json({
      message: 'Hemos enviado su solicitud para ser conductor. Proximamente se le informará si fue aceptada'
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

async function CU04AprobarPasajeroComoConductor(req: Request, res: Response) {
  //falta logica de permisos
  //falta mostrar reportes(?)
  try {
    const userData = req.body.sanitizedInput;
    const idUsuario = Number.parseInt(req.params.id as string);
    const usuario = await em.findOneOrFail(Usuario, { idUsuario });

    if (!(usuario.estadoConductor === EstadoConductor.PENDIENTE)) {
      return res.status(409).json({
        message:
          'El usuario no tiene pendiente ninguna solicitud de convertirse en Conductor',
      });
    }

    if (userData.estadoConductor === EstadoConductor.APROBADO) {
      userData.tipoUsuario = TipoUsuario.CONDUCTOR;
    }
    //en caso de ser denegado podriamos borrar los datos de licencia cargados. Por ahora innecesario

    Object.assign(usuario, userData);
    await em.flush();
    res
      .status(200)
      .json({ message: 'El campo se actualizó correctamente', data: usuario });
  } catch (error: any) {
    if (error.status === 404) {
      res.status(404).json({ message: 'No se encontro el usuario' });
    }
    res.status(500).json({ message: error.message });
  }
}

async function loginUsuario(req: Request, res: Response) {
  try {
    const { email, contrasenaUsuario } = req.body;

    if (!email || !contrasenaUsuario) {
      return res
        .status(400)
        .json({ message: 'Email y contraseña son requeridos' });
    }

    const usuario = await em.findOne(
      Usuario,
      { email },
      { populate: ['contrasenaUsuario'] },
    );

    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Validar que el usuario no esté inhabilitado
    if (usuario.estadoUsuario === EstadoUsuario.INHABILITADO) {
      return res
        .status(403)
        .json({ message: 'Usuario inhabilitado por el administrador' });
    }

    const contrasenaHasheada = Usuario.hashPassword(contrasenaUsuario);

    if (usuario.contrasenaUsuario !== contrasenaHasheada) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Obtener la clave secreta del entorno
    const secretKey = process.env.JWT_SECRET;

    if (!secretKey) {
      console.error('ERROR CRÍTICO: Falta JWT_SECRET en el archivo .env');
      return res
        .status(500)
        .json({ message: 'Error de configuración en el servidor' });
    }

    // generar token , expiración de 2 horas
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

export {
  usuarioValidator,
  getUsuarioById,
  CU01RegistrarUsuario,
  CU02EditarPasajero,
  CU03SolicitarPasajeroComoConductor,
  obtenerConductoresPendientes,
  loginUsuario,
  CU04AprobarPasajeroComoConductor,
};
