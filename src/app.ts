import express from 'express';
import 'reflect-metadata';
import { orm, syncSchema } from './shared/db/orm.js';
import { RequestContext } from '@mikro-orm/core';
import cors from 'cors';
import { seedDatabase } from './shared/seeder.js';

import { localidadRouter } from './localidad/localidad.routes.js';
import { usuarioRouter } from './usuario/usuario.routes.js';
import { vehiculoRouter } from './usuario/vehiculo.routes.js';
import { viajeRouter } from './viaje/viaje.routes.js';
import { calificacionRouter } from './calificacion/calificacion.routes.js';
import { sancionRouter } from './infraccion/sancion.routes.js';

const app = express();

app.use(cors());

app.use(express.json());

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});

app.use('/api/localidad', localidadRouter);
app.use('/api/usuario', usuarioRouter);
app.use('/api/vehiculo', vehiculoRouter);
app.use('/api/viaje', viajeRouter);
app.use('/api/calificacion', calificacionRouter);
app.use('/api/sancion', sancionRouter);

app.use((_, res) => {
  return res.status(404).send({ message: 'Resource not found' });
});

await initServer();

const server = app.listen(3000, () => {
  console.log(`Server is running on http://localhost:3000`);
});

async function initServer() {
  // Esquema de la base de datos
  await syncSchema();

  // Ejecutar seeding solo en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    await seedDatabase();
  }
}
/*
const server = app.listen(process.env.PORT, () => {
  console.log(
    `Server is running on http://${process.env.HOST}:${process.env.PORT}`,
  );
});*/
