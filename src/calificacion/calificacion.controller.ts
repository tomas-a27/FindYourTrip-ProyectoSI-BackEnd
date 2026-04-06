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
      usuarioCalificadorId,
      puntos,
      tipo,
      comentario,
      reporte
    } = req.body;

    if (!puntos) {
      return res.status(200).json({ message: 'Viaje finalizado sin calificación.' });
    }

    const viaje = await em.findOne(Viaje, { viajeId });
    const Calificado = await em.findOne(Usuario, { idUsuario: usuarioCalificadoId });
    const Calificador = await em.findOne(Usuario, { idUsuario: usuarioCalificadorId });

    if (!viaje || !Calificado || !Calificador) {
      return res.status(404).json({ message: 'Datos de viaje o usuario no encontrados.' });
    }
 
    const nuevaCalificacion = em.create(Calificacion, {
      viaje: viaje,
      usuarioCalificado: Calificado,
      usuarioCalificador: Calificador,
      calificacionValoracionLikert: Number(puntos),
      calificacionTipo: tipo
    });

    em.persist(nuevaCalificacion);

    if (reporte && reporte.motivo) {
      const nuevaInfraccion = em.create(Infraccion, {
        calificacion: nuevaCalificacion, 
        descripcionInfraccion: reporte.motivo, 
        comentarioInfraccion: reporte.comentarioInfraccion || '',
        infraccionFecha: new Date(),
        calificacionTipo: tipo 
      });
      em.persist(nuevaInfraccion);
    }
    await em.flush();

    // Actualizamos promedio del usuario calificado
    const calificaciones = await em.find(Calificacion, { usuarioCalificado: Calificado });
    let sumaPas = 0, cantPas = 0;
    let sumaCond = 0, cantCond = 0;

    for (const c of calificaciones) {
      if (c.calificacionTipo && c.calificacionTipo.toLowerCase() === 'pasajero') {
        sumaPas += Number(c.calificacionValoracionLikert);
        cantPas++;
      } else if (c.calificacionTipo && c.calificacionTipo.toLowerCase() === 'conductor') {
        sumaCond += Number(c.calificacionValoracionLikert);
        cantCond++;
      }
    }

    if (cantPas > 0) {
      Calificado.calificacionPas = parseFloat((sumaPas / cantPas).toFixed(2));
    }
    if (cantCond > 0) {
      Calificado.calificacionConductor = parseFloat((sumaCond / cantCond).toFixed(2));
    }
    
    await em.flush();

    res.status(201).json({
      message: reporte ? 'Registro de infracción y calificación exitoso.' : 'Calificación exitosa.'
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export { registrarCalificacionGenerica };