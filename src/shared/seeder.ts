import { Usuario } from '../usuario/usuario.entity.js';
import { Vehiculo } from '../usuario/vehiculo.entity.js';
import { Localidad } from '../localidad/localidad.entity.js';
import { orm } from './db/orm.js';
import {
  EstadoUsuario,
  EstadoConductor,
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

  const resPerfilCarlos = await fetch(
    'https://ui-avatars.com/api/?name=Carlos+Gonzalez&background=random&size=200',
  );
  const bufferPerfilCarlos = Buffer.from(await resPerfilCarlos.arrayBuffer());

  const resLicenciaCarlos = await fetch(
    'https://placehold.co/400x250/png?text=Licencia+Carlos',
  );
  const bufferLicenciaCarlos = Buffer.from(
    await resLicenciaCarlos.arrayBuffer(),
  );

  const resPerfilMaria = await fetch(
    'https://ui-avatars.com/api/?name=Maria+Lopez&background=random&size=200',
  );
  const bufferPerfilMaria = Buffer.from(await resPerfilMaria.arrayBuffer());

  const resLicenciaMaria = await fetch(
    'https://placehold.co/400x250/png?text=Licencia+Maria',
  );
  const bufferLicenciaMaria = Buffer.from(await resLicenciaMaria.arrayBuffer());

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

  const hashPsw2 = await Usuario.hashPassword('conductor123');
  const conductor1 = em.create(Usuario, {
    tipoUsuario: TipoUsuario.CONDUCTOR,
    nombreUsuario: 'Carlos',
    apellidoUsuario: 'González',
    tipoDocumento: TipoDocumento.DNI,
    nroDocumento: '30111222',
    email: 'carlos.gonzalez@gmail.com',
    telefono: '3415551001',
    contrasenaUsuario: hashPsw2,
    estadoUsuario: EstadoUsuario.HABILITADO,
    generoUsuario: GeneroUsuario.MASCULINO,
    nroLicenciaConductorUsuario: '30111222',
    vigenciaLicenciaConductorUsuario: new Date('2028-12-31'),
    fotoLicenciaConductorUsuario: bufferLicenciaCarlos,
    fotoPerfil: bufferPerfilCarlos,
    estadoConductor: EstadoConductor.APROBADO,
  });

  const conductor2 = em.create(Usuario, {
    tipoUsuario: TipoUsuario.CONDUCTOR,
    nombreUsuario: 'María',
    apellidoUsuario: 'López',
    tipoDocumento: TipoDocumento.DNI,
    nroDocumento: '27888999',
    email: 'maria.lopez@gmail.com',
    telefono: '3415551002',
    contrasenaUsuario: hashPsw2,
    estadoUsuario: EstadoUsuario.HABILITADO,
    generoUsuario: GeneroUsuario.FEMENINO,
    nroLicenciaConductorUsuario: '27888999',
    vigenciaLicenciaConductorUsuario: new Date('2029-06-30'),
    fotoLicenciaConductorUsuario: bufferLicenciaMaria,
    fotoPerfil: bufferPerfilMaria,
    estadoConductor: EstadoConductor.APROBADO,
  });

  em.create(Vehiculo, {
    patente: 'ABC123',
    marca: 'Toyota',
    modelo: 'Corolla',
    color: 'Blanco',
    cantLugares: 4,
    usuario: conductor1,
  });

  em.create(Vehiculo, {
    patente: 'DEF456',
    marca: 'Ford',
    modelo: 'Focus',
    color: 'Gris',
    cantLugares: 4,
    usuario: conductor1,
  });

  em.create(Vehiculo, {
    patente: 'GHI789',
    marca: 'Volkswagen',
    modelo: 'Gol',
    color: 'Negro',
    cantLugares: 4,
    usuario: conductor2,
  });

  const localidadesData = [
    // --- SANTA FE (15) ---
    { codPostal: '2000', nombre: 'Rosario' },
    { codPostal: '3000', nombre: 'Santa Fe' },
    { codPostal: '2600', nombre: 'Venado Tuerto' },
    { codPostal: '2300', nombre: 'Rafaela' },
    { codPostal: '3080', nombre: 'Esperanza' },
    { codPostal: '3560', nombre: 'Reconquista' },
    { codPostal: '2200', nombre: 'San Lorenzo' },
    { codPostal: '2132', nombre: 'Funes' },
    { codPostal: '2134', nombre: 'Roldán' },
    { codPostal: '2170', nombre: 'Casilda' },
    { codPostal: '2500', nombre: 'Cañada de Gómez' },
    { codPostal: '2919', nombre: 'Villa Constitución' },
    { codPostal: '2128', nombre: 'Arroyo Seco' },
    { codPostal: '2121', nombre: 'Pérez' },
    { codPostal: '2607', nombre: 'Villa Cañás' },

    // --- BUENOS AIRES & CABA (12) ---
    { codPostal: '1000', nombre: 'CABA' },
    { codPostal: '1900', nombre: 'La Plata' },
    { codPostal: '7600', nombre: 'Mar del Plata' },
    { codPostal: '8000', nombre: 'Bahía Blanca' },
    { codPostal: '7000', nombre: 'Tandil' },
    { codPostal: '6000', nombre: 'Junín' },
    { codPostal: '6600', nombre: 'Mercedes' },
    { codPostal: '2900', nombre: 'San Nicolás' },
    { codPostal: '6700', nombre: 'Luján' },
    { codPostal: '1878', nombre: 'Quilmes' },
    { codPostal: '1824', nombre: 'Lanús' },
    { codPostal: '1642', nombre: 'San Isidro' },

    // --- CÓRDOBA (5) ---
    { codPostal: '5000', nombre: 'Córdoba' },
    { codPostal: '5800', nombre: 'Río Cuarto' },
    { codPostal: '5152', nombre: 'Villa Carlos Paz' },
    { codPostal: '5900', nombre: 'Villa María' },
    { codPostal: '2400', nombre: 'San Francisco' },

    // --- RESTO DEL PAÍS (8) ---
    { codPostal: '5500', nombre: 'Mendoza' },
    { codPostal: '4000', nombre: 'San Miguel de Tucumán' },
    { codPostal: '4400', nombre: 'Salta' },
    { codPostal: '5400', nombre: 'San Juan' },
    { codPostal: '8300', nombre: 'Neuquén' },
    { codPostal: '8400', nombre: 'San Carlos de Bariloche' },
    { codPostal: '3400', nombre: 'Corrientes' },
    { codPostal: '3500', nombre: 'Resistencia' },
  ];

  const localidadCount = await em.count(Localidad);

  if (localidadCount === 0) {
    localidadesData.forEach((data) => {
      em.create(Localidad, data);
    });
    console.log(`✅ ${localidadesData.length} localidades creadas.`);
  }

  await em.flush();
}
