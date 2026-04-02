import { Request, Response } from 'express';
import { orm } from '../shared/db/orm.js';
import { Usuario } from '../usuario/usuario.entity.js';
import { Infraccion } from './infraccion.entity.js';
import { Sancion } from './sancion.entity.js';
import { SancionInfraccion } from './sancionInfraccion.entity.js';
import { EstadoUsuario } from '../shared/enums.js';

const em = orm.em;


async function obtenerUsuariosASancionar(req: Request, res: Response) {
  try {
    const usuarios = await em.find(Usuario, {});

    const resultado: any[] = [];

    for (const usuario of usuarios) {
      // trae infracciones del usuario
      const infracciones = await em.find(Infraccion, {
        calificacion: {
          usuarioCalificado: usuario
        }
      }, {
        populate: ['calificacion']
      });

      if (infracciones.length < 3) continue;

      // ordena por fecha de infracción
      infracciones.sort((a, b) =>
        new Date(b.infraccionFecha).getTime() - new Date(a.infraccionFecha).getTime()
      );

      const ultimas3 = infracciones.slice(0, 3);
      const fechaUltimaInfraccion = ultimas3[0].infraccionFecha;

      // trae sanciones del usuario
      const sanciones = await em.find(Sancion, { usuario });

      let cumpleCondicion = false;

      if (sanciones.length === 0) {
        // no tiene sanción
        cumpleCondicion = true;
      } else {
        // ordena sanciones por fechaInicio
        sanciones.sort((a, b) =>
          new Date(b.sancionFechaIni).getTime() - new Date(a.sancionFechaIni).getTime()
        );

        const ultimaSancion = sanciones[0];

        // si la sanción está desestimada, no se muestra
        if (
          !ultimaSancion.sancionFechaFin &&
          ultimaSancion.sancionDescripcion === 'Desestimada'
        ) {
          // filtrar infracciones con fecha posterior a desestimarlas
          const infraccionesPosteriores = infracciones.filter(i =>
            new Date(i.infraccionFecha) > new Date(ultimaSancion.sancionFechaIni)
          );

          // si tiene 3 o más nuevas, vuelve a aparecer
          if (infraccionesPosteriores.length >= 3) {
            cumpleCondicion = true;
          } else {
            cumpleCondicion = false;
          }
        }
        else if (
          ultimaSancion.sancionFechaFin &&
          new Date(ultimaSancion.sancionFechaFin) < new Date(fechaUltimaInfraccion)
        ) {
          cumpleCondicion = true;
        }
      }

      if (cumpleCondicion) {
        const usuarioDTO = {
          idUsuario: usuario.idUsuario,
          nombre: usuario.nombreUsuario,
          apellido: usuario.apellidoUsuario,
          email: usuario.email,
          telefono: usuario.telefono,
          tipoUsuario: usuario.tipoUsuario,
          foto: usuario.fotoPerfil,
          cantidadReportes: infracciones.length
        };
        
        resultado.push(usuarioDTO);
      }
    }

    res.status(200).json({ message: 'Usuarios a sancionar', data: resultado });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}


async function verInfraccionesUsuario(req: Request, res: Response) {
  try {
    const idUsuario = Number.parseInt(req.params.id as string);
    const usuario = await em.findOneOrFail(Usuario, { idUsuario });

    const infracciones = await em.find(Infraccion, {
      calificacion: {
        usuarioCalificado: usuario
      }
    }, {
      populate: ['calificacion']
    });

    res.status(200).json({
      data: {
        nombre: usuario.nombreUsuario,
        apellido: usuario.apellidoUsuario,
        tipoDocumento: usuario.tipoDocumento,
        nroDocumento: usuario.nroDocumento,
        email: usuario.email,
        telefono: usuario.telefono,
        tipoUsuario: usuario.tipoUsuario,
        foto: usuario.fotoPerfil,
        calificacionPas: usuario.calificacionPas,
        calificacionConductor: usuario.calificacionConductor,
        nroLicencia: usuario.nroLicenciaConductorUsuario,
        vencimientoLicencia: usuario.vigenciaLicenciaConductorUsuario,
        cantidadInfracciones: infracciones.length,
        infracciones: infracciones.map(i => ({
          fecha: i.infraccionFecha,
          tipo: i.calificacionTipo,
          descripcion: i.descripcionInfraccion,
          comentario: i.comentarioInfraccion
        }))
      }
    });
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(500).json({ message: error.message });
  }
}


async function desestimarUsuario(req: Request, res: Response) {
  try {
    const idUsuario = Number.parseInt(req.params.id as string);
    const usuario = await em.findOneOrFail(Usuario, { idUsuario });

    em.create(Sancion, {
      usuario,
      sancionFechaIni: new Date(),
      sancionDescripcion: 'Desestimada'
    });

    await em.flush();
    res.status(200).json({ message: 'Sanción desestimada registrada' });
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(500).json({ message: error.message });
  }
}


async function inhabilitarUsuario(req: Request, res: Response) {
  try {
    const idUsuario = Number.parseInt(req.params.id as string);
    const { motivo, dias } = req.body;

    if (!motivo || !dias) {
      return res.status(400).json({ message: 'Motivo y días son obligatorios' });
    }

    const usuario = await em.findOneOrFail(Usuario, { idUsuario });

    const fechaInicio = new Date();
    const fechaFin = new Date();
    fechaFin.setDate(fechaFin.getDate() + Number(dias));

    const sancion = em.create(Sancion, {
      usuario,
      sancionFechaIni: fechaInicio,
      sancionFechaFin: fechaFin,
      sancionDescripcion: motivo
    });

    const infracciones = await em.find(Infraccion, {
      calificacion: {
        usuarioCalificado: usuario
      }
    });

    const sancionInfraccion = em.create(SancionInfraccion, {
      sancion
    });

    infracciones.forEach(i => sancionInfraccion.infracciones.add(i));
    usuario.estadoUsuario = EstadoUsuario.INHABILITADO;

    await em.flush();
    res.status(200).json({ message: 'Usuario inhabilitado correctamente' });
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(500).json({ message: error.message });
  }
}


export {
  obtenerUsuariosASancionar,
  verInfraccionesUsuario,
  desestimarUsuario,
  inhabilitarUsuario
};