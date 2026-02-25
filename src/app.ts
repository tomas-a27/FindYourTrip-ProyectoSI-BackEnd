import express from 'express';
import 'reflect-metadata';
import { orm, syncSchema } from './shared/db/orm.js';
import { RequestContext } from '@mikro-orm/core';
import cors from 'cors';

import { localidadRouter } from './localidad/localidad.routes.js';
import { usuarioRouter } from './usuario/usuario.routes.js';
import { vehiculoRouter } from './usuario/vehiculo.routes.js';

const app = express();

app.use(cors());

app.use(express.json());

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});

app.use('/api/localidad', localidadRouter);
app.use('/api/usuario', usuarioRouter);
app.use('/api/vehiculo', vehiculoRouter);

app.use((_, res) => {
  return res.status(404).send({ message: 'Resource not found' });
});

await syncSchema();

const server = app.listen(3000, () => {
  console.log(`Server is running on http://localhost:3000`);
});

/*
const server = app.listen(process.env.PORT, () => {
  console.log(
    `Server is running on http://${process.env.HOST}:${process.env.PORT}`,
  );
});*/
