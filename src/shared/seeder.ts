import { Usuario } from '../usuario/usuario.entity.js';
import { orm } from './db/orm.js';
import {
  EstadoUsuario,
  GeneroUsuario,
  TipoDocumento,
  TipoUsuario,
} from './enums.js';

export async function seedDatabase() {
  const em = orm.em.fork();

  const usuarioCount = await em.count(Usuario);

  if (usuarioCount > 0) {
    console.log('La base de datos ya contiene datos iniciales');
    return;
  }

  const hashPsw1 = await Usuario.hashPassword('admin123');
  em.create(Usuario, {
    tipoUsuario: TipoUsuario.ADMINISTRADOR,
    nombreUsuario: 'Juan Ramón',
    apellidoUsuario: 'Perez',
    tipoDocumento: TipoDocumento.DNI,
    nroDocumento: '99999999',
    email: 'admin@findyourtrip.com',
    telefono: '3252982833',
    contrasenaUsuario: hashPsw1,
    estadoUsuario: EstadoUsuario.HABILITADO,
    generoUsuario: GeneroUsuario.OTRO,
  });

  await em.flush();
}
