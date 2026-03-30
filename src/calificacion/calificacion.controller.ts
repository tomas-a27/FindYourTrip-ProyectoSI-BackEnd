import { Request, Response } from 'express';
import { orm } from '../shared/db/orm.js'; 
import { Calificacion } from './calificacion.entity.js';
import { Infraccion } from '../infraccion/infraccion.entity.js';
import { Usuario } from '../usuario/usuario.entity.js';
import { Viaje } from '../viaje/viaje.entity.js';

const em = orm.em;

async function registrarCalificacionGenerica(req: Request, res: Response) {
  try {
    const {
      viajeId,
      usuarioCalificadoId,
      puntos,
      tipo,
      comentario,
      reporte // Objeto opcional: { motivo(descripcionInfraccion), comentario(comentarioInfraccion) }   VER SI COMENTARIO DE INFRACCION VA O NO, 
      //si no va el comentario de infraccion, entonces aca solo nos traemos el motivo y no el objeto reporte
    } = req.body;

    if (!puntos) {
      return res.status(200).json({ message: 'Viaje finalizado sin calificación.' });
    }

    const viaje = await em.findOne(Viaje, { viajeId });
    const usuarioCalificado = await em.findOne(Usuario, { idUsuario: usuarioCalificadoId });

    if (!viaje || !usuarioCalificado) {
      return res.status(404).json({ message: 'Datos de viaje o usuario no encontrados.' });
    }
 
    const nuevaCalificacion = em.create(Calificacion, {
      viaje: viaje,
      usuario: usuarioCalificado,
      calificacionValoracionLikert: puntos,
      calificacionTipo: tipo,
      comentarioCalificacion: comentario ? String(comentario) : undefined
    });

    await em.persist(nuevaCalificacion).flush();

    if (reporte && reporte.motivo) {
      const nuevaInfraccion = em.create(Infraccion, {
        calificacion: nuevaCalificacion, 
        descripcionInfraccion: reporte.motivo, 
        comentarioInfraccion: reporte.comentario || '',
        infraccionFecha: new Date(),
        calificacionTipo: tipo 
      });
      await em.persist(nuevaInfraccion).flush();
    }

    res.status(201).json({
      message: reporte ? 'Registro de infracción y calificación exitoso.' : 'Calificación exitosa.'
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export { registrarCalificacionGenerica };