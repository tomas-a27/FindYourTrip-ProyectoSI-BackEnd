import { Usuario } from '../usuario/usuario.entity.js';
import { Vehiculo } from '../usuario/vehiculo.entity.js';
import { Localidad } from '../localidad/localidad.entity.js';
import { Viaje } from '../viaje/viaje.entity.js';
import { SolicitudViaje } from '../viaje/solicitudViaje.entity.js';
import { orm } from './db/orm.js';
import {
  EstadoUsuario,
  EstadoConductor,
  GeneroUsuario,
  TipoDocumento,
  TipoUsuario,
  EstadoSolicitud,
  EstadoViaje,
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
  const administradoresData = [
    {
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
    },
  ];

  administradoresData.forEach((data) => {
    em.create(Usuario, data);
  });
  console.log(`✅ ${administradoresData.length} administradores creados.`);

  const hashPsw2 = await Usuario.hashPassword('conductor123');
  const conductoresData = [
    {
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
    },
    {
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
    },
  ];

  const conductores = conductoresData.map((data) => em.create(Usuario, data));
  const [conductor1, conductor2] = conductores;
  console.log(`✅ ${conductoresData.length} conductores creados.`);

  const hashPsw3 = await Usuario.hashPassword('pasajero123');
  const pasajerosData = [
    {
      tipoUsuario: TipoUsuario.PASAJERO,
      nombreUsuario: 'Lucía',
      apellidoUsuario: 'Fernández',
      tipoDocumento: TipoDocumento.DNI,
      nroDocumento: '33444555',
      email: 'lucia.fernandez@gmail.com',
      telefono: '3415552001',
      contrasenaUsuario: hashPsw3,
      estadoUsuario: EstadoUsuario.HABILITADO,
      generoUsuario: GeneroUsuario.FEMENINO,
    },
    {
      tipoUsuario: TipoUsuario.PASAJERO,
      nombreUsuario: 'Martín',
      apellidoUsuario: 'Suárez',
      tipoDocumento: TipoDocumento.DNI,
      nroDocumento: '34555666',
      email: 'martin.suarez@gmail.com',
      telefono: '3415552002',
      contrasenaUsuario: hashPsw3,
      estadoUsuario: EstadoUsuario.HABILITADO,
      generoUsuario: GeneroUsuario.MASCULINO,
    },
  ];

  const pasajeros = pasajerosData.map((data) => em.create(Usuario, data));
  const [pasajero1, pasajero2] = pasajeros;
  console.log(`✅ ${pasajerosData.length} pasajeros creados.`);

  const vehiculo1 = em.create(Vehiculo, {
    patente: 'ABC123',
    marca: 'Toyota',
    modelo: 'Corolla',
    color: 'Blanco',
    cantLugares: 4,
    usuario: conductor1,
  });

  const vehiculo2 = em.create(Vehiculo, {
    patente: 'DEF456',
    marca: 'Ford',
    modelo: 'Focus',
    color: 'Gris',
    cantLugares: 4,
    usuario: conductor1,
  });

  const vehiculo3 = em.create(Vehiculo, {
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

  let rosario!: Localidad;
  let santaFe!: Localidad;
  let caba!: Localidad;
  let laPlata!: Localidad;
  let cordoba!: Localidad;
  let mendoza!: Localidad;

  localidadesData.forEach((data) => {
    const localidad = em.create(Localidad, data);

    if (data.nombre === 'Rosario') {
      rosario = localidad;
    }

    if (data.nombre === 'Santa Fe') {
      santaFe = localidad;
    }

    if (data.nombre === 'CABA') {
      caba = localidad;
    }

    if (data.nombre === 'La Plata') {
      laPlata = localidad;
    }

    if (data.nombre === 'Córdoba') {
      cordoba = localidad;
    }

    if (data.nombre === 'Mendoza') {
      mendoza = localidad;
    }
  });
  console.log(`✅ ${localidadesData.length} localidades creadas.`);

  const viaje1 = em.create(Viaje, {
    viajeFecha: new Date('2026-04-25'),
    viajeHorario: '09:00',
    viajeCantLugares: 3,
    viajeEstado: EstadoViaje.PENDIENTE,
    viajeComentario: 'Viaje de prueba generado por el seeder.',
    viajeAceptaMascotas: true,
    viajePrecio: 5500,
    vehiculo: vehiculo1,
    usuarioConductor: conductor1,
    viajeOrigen: rosario,
    viajeDestino: santaFe,
  } as any);

  const viaje2 = em.create(Viaje, {
    viajeFecha: new Date('2026-04-26'),
    viajeHorario: '18:30',
    viajeCantLugares: 2,
    viajeEstado: EstadoViaje.PENDIENTE,
    viajeComentario: 'Segundo viaje de prueba generado por el seeder.',
    viajeAceptaMascotas: false,
    viajePrecio: 6200,
    vehiculo: vehiculo3,
    usuarioConductor: conductor2,
    viajeOrigen: santaFe,
    viajeDestino: rosario,
  } as any);
  console.log('✅ 2 viajes creados para conductores.');

  const viajesFinalizadosData = [
    {
      viajeFecha: new Date('2026-03-21'),
      viajeHorario: '07:30',
      viajeCantLugares: 3,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado Rosario a Santa Fe.',
      viajeAceptaMascotas: true,
      viajePrecio: 5200,
      vehiculo: vehiculo1,
      usuarioConductor: conductor1,
      viajeOrigen: rosario,
      viajeDestino: santaFe,
    },
    {
      viajeFecha: new Date('2026-03-22'),
      viajeHorario: '09:15',
      viajeCantLugares: 2,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado Santa Fe a Rosario.',
      viajeAceptaMascotas: false,
      viajePrecio: 5400,
      vehiculo: vehiculo3,
      usuarioConductor: conductor2,
      viajeOrigen: santaFe,
      viajeDestino: rosario,
    },
    {
      viajeFecha: new Date('2026-03-23'),
      viajeHorario: '10:00',
      viajeCantLugares: 3,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado CABA a La Plata.',
      viajeAceptaMascotas: true,
      viajePrecio: 6100,
      vehiculo: vehiculo2,
      usuarioConductor: conductor1,
      viajeOrigen: caba,
      viajeDestino: laPlata,
    },
    {
      viajeFecha: new Date('2026-03-24'),
      viajeHorario: '12:45',
      viajeCantLugares: 1,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado La Plata a CABA.',
      viajeAceptaMascotas: false,
      viajePrecio: 6000,
      vehiculo: vehiculo3,
      usuarioConductor: conductor2,
      viajeOrigen: laPlata,
      viajeDestino: caba,
    },
    {
      viajeFecha: new Date('2026-03-25'),
      viajeHorario: '06:40',
      viajeCantLugares: 4,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado Córdoba a Mendoza.',
      viajeAceptaMascotas: true,
      viajePrecio: 9800,
      vehiculo: vehiculo1,
      usuarioConductor: conductor1,
      viajeOrigen: cordoba,
      viajeDestino: mendoza,
    },
    {
      viajeFecha: new Date('2026-03-26'),
      viajeHorario: '08:20',
      viajeCantLugares: 3,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado Mendoza a Córdoba.',
      viajeAceptaMascotas: false,
      viajePrecio: 9700,
      vehiculo: vehiculo3,
      usuarioConductor: conductor2,
      viajeOrigen: mendoza,
      viajeDestino: cordoba,
    },
    {
      viajeFecha: new Date('2026-03-27'),
      viajeHorario: '14:00',
      viajeCantLugares: 2,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado Rosario a CABA.',
      viajeAceptaMascotas: true,
      viajePrecio: 7900,
      vehiculo: vehiculo2,
      usuarioConductor: conductor1,
      viajeOrigen: rosario,
      viajeDestino: caba,
    },
    {
      viajeFecha: new Date('2026-03-28'),
      viajeHorario: '15:35',
      viajeCantLugares: 2,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado CABA a Rosario.',
      viajeAceptaMascotas: false,
      viajePrecio: 7800,
      vehiculo: vehiculo3,
      usuarioConductor: conductor2,
      viajeOrigen: caba,
      viajeDestino: rosario,
    },
    {
      viajeFecha: new Date('2026-03-29'),
      viajeHorario: '11:10',
      viajeCantLugares: 3,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado Santa Fe a Córdoba.',
      viajeAceptaMascotas: true,
      viajePrecio: 8600,
      vehiculo: vehiculo1,
      usuarioConductor: conductor1,
      viajeOrigen: santaFe,
      viajeDestino: cordoba,
    },
    {
      viajeFecha: new Date('2026-03-30'),
      viajeHorario: '17:25',
      viajeCantLugares: 2,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado Mendoza a La Plata.',
      viajeAceptaMascotas: false,
      viajePrecio: 10500,
      vehiculo: vehiculo2,
      usuarioConductor: conductor1,
      viajeOrigen: mendoza,
      viajeDestino: laPlata,
    },
    {
      viajeFecha: new Date('2026-03-31'),
      viajeHorario: '07:10',
      viajeCantLugares: 3,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado Rosario a Santa Fe (extra 1).',
      viajeAceptaMascotas: true,
      viajePrecio: 5300,
      vehiculo: vehiculo1,
      usuarioConductor: conductor1,
      viajeOrigen: rosario,
      viajeDestino: santaFe,
    },
    {
      viajeFecha: new Date('2026-04-01'),
      viajeHorario: '08:40',
      viajeCantLugares: 2,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado Santa Fe a Rosario (extra 2).',
      viajeAceptaMascotas: false,
      viajePrecio: 5500,
      vehiculo: vehiculo3,
      usuarioConductor: conductor2,
      viajeOrigen: santaFe,
      viajeDestino: rosario,
    },
    {
      viajeFecha: new Date('2026-04-02'),
      viajeHorario: '09:20',
      viajeCantLugares: 4,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado CABA a La Plata (extra 3).',
      viajeAceptaMascotas: true,
      viajePrecio: 6200,
      vehiculo: vehiculo2,
      usuarioConductor: conductor1,
      viajeOrigen: caba,
      viajeDestino: laPlata,
    },
    {
      viajeFecha: new Date('2026-04-03'),
      viajeHorario: '10:35',
      viajeCantLugares: 1,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado La Plata a CABA (extra 4).',
      viajeAceptaMascotas: false,
      viajePrecio: 6100,
      vehiculo: vehiculo3,
      usuarioConductor: conductor2,
      viajeOrigen: laPlata,
      viajeDestino: caba,
    },
    {
      viajeFecha: new Date('2026-04-04'),
      viajeHorario: '06:25',
      viajeCantLugares: 3,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado Córdoba a Mendoza (extra 5).',
      viajeAceptaMascotas: true,
      viajePrecio: 9900,
      vehiculo: vehiculo1,
      usuarioConductor: conductor1,
      viajeOrigen: cordoba,
      viajeDestino: mendoza,
    },
    {
      viajeFecha: new Date('2026-04-05'),
      viajeHorario: '07:55',
      viajeCantLugares: 2,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado Mendoza a Córdoba (extra 6).',
      viajeAceptaMascotas: false,
      viajePrecio: 9600,
      vehiculo: vehiculo3,
      usuarioConductor: conductor2,
      viajeOrigen: mendoza,
      viajeDestino: cordoba,
    },
    {
      viajeFecha: new Date('2026-04-06'),
      viajeHorario: '13:10',
      viajeCantLugares: 2,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado Rosario a CABA (extra 7).',
      viajeAceptaMascotas: true,
      viajePrecio: 8000,
      vehiculo: vehiculo2,
      usuarioConductor: conductor1,
      viajeOrigen: rosario,
      viajeDestino: caba,
    },
    {
      viajeFecha: new Date('2026-04-07'),
      viajeHorario: '14:45',
      viajeCantLugares: 2,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado CABA a Rosario (extra 8).',
      viajeAceptaMascotas: false,
      viajePrecio: 7850,
      vehiculo: vehiculo3,
      usuarioConductor: conductor2,
      viajeOrigen: caba,
      viajeDestino: rosario,
    },
    {
      viajeFecha: new Date('2026-04-08'),
      viajeHorario: '10:50',
      viajeCantLugares: 3,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado Santa Fe a Córdoba (extra 9).',
      viajeAceptaMascotas: true,
      viajePrecio: 8700,
      vehiculo: vehiculo1,
      usuarioConductor: conductor1,
      viajeOrigen: santaFe,
      viajeDestino: cordoba,
    },
    {
      viajeFecha: new Date('2026-04-09'),
      viajeHorario: '16:30',
      viajeCantLugares: 2,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado Mendoza a La Plata (extra 10).',
      viajeAceptaMascotas: false,
      viajePrecio: 10600,
      vehiculo: vehiculo2,
      usuarioConductor: conductor1,
      viajeOrigen: mendoza,
      viajeDestino: laPlata,
    },
    {
      viajeFecha: new Date('2026-04-10'),
      viajeHorario: '07:45',
      viajeCantLugares: 3,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado Rosario a Santa Fe (extra 11).',
      viajeAceptaMascotas: true,
      viajePrecio: 5250,
      vehiculo: vehiculo1,
      usuarioConductor: conductor1,
      viajeOrigen: rosario,
      viajeDestino: santaFe,
    },
    {
      viajeFecha: new Date('2026-04-11'),
      viajeHorario: '09:05',
      viajeCantLugares: 2,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado CABA a La Plata (extra 12).',
      viajeAceptaMascotas: false,
      viajePrecio: 6150,
      vehiculo: vehiculo3,
      usuarioConductor: conductor2,
      viajeOrigen: caba,
      viajeDestino: laPlata,
    },
    {
      viajeFecha: new Date('2026-04-12'),
      viajeHorario: '12:00',
      viajeCantLugares: 4,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado Córdoba a Mendoza (extra 13).',
      viajeAceptaMascotas: true,
      viajePrecio: 9950,
      vehiculo: vehiculo2,
      usuarioConductor: conductor1,
      viajeOrigen: cordoba,
      viajeDestino: mendoza,
    },
    {
      viajeFecha: new Date('2026-04-13'),
      viajeHorario: '15:20',
      viajeCantLugares: 2,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado CABA a Rosario (extra 14).',
      viajeAceptaMascotas: false,
      viajePrecio: 7900,
      vehiculo: vehiculo3,
      usuarioConductor: conductor2,
      viajeOrigen: caba,
      viajeDestino: rosario,
    },
    {
      viajeFecha: new Date('2026-04-14'),
      viajeHorario: '18:05',
      viajeCantLugares: 3,
      viajeEstado: EstadoViaje.FINALIZADO,
      viajeComentario: 'Viaje finalizado Santa Fe a Córdoba (extra 15).',
      viajeAceptaMascotas: true,
      viajePrecio: 8750,
      vehiculo: vehiculo1,
      usuarioConductor: conductor1,
      viajeOrigen: santaFe,
      viajeDestino: cordoba,
    },
  ];

  const viajesFinalizados = viajesFinalizadosData.map((data) =>
    em.create(Viaje, data as any),
  );
  console.log(`✅ ${viajesFinalizadosData.length} viajes finalizados creados.`);

  const pasajerosDisponibles = [pasajero1, pasajero2];
  const getPasajeroAleatorio = () =>
    pasajerosDisponibles[
      Math.floor(Math.random() * pasajerosDisponibles.length)
    ];

  viajesFinalizados.forEach((viajeFinalizado) => {
    em.create(SolicitudViaje, {
      solViajeFecha: new Date(),
      estadoSolicitud: EstadoSolicitud.APROBADA,
      usuario: getPasajeroAleatorio(),
      viaje: viajeFinalizado,
    } as any);

    em.create(SolicitudViaje, {
      solViajeFecha: new Date(),
      estadoSolicitud: EstadoSolicitud.APROBADA,
      usuario: getPasajeroAleatorio(),
      viaje: viajeFinalizado,
    } as any);

    em.create(SolicitudViaje, {
      solViajeFecha: new Date(),
      estadoSolicitud: EstadoSolicitud.APROBADA,
      usuario: getPasajeroAleatorio(),
      viaje: viajeFinalizado,
    } as any);
  });
  console.log(
    `✅ ${viajesFinalizados.length * 3} solicitudes creadas para viajes finalizados (todas aprobadas).`,
  );

  em.create(SolicitudViaje, {
    solViajeFecha: new Date('2026-04-20'),
    estadoSolicitud: EstadoSolicitud.PENDIENTE,
    usuario: pasajero1,
    viaje: viaje1,
  } as any);

  em.create(SolicitudViaje, {
    solViajeFecha: new Date('2026-04-21'),
    estadoSolicitud: EstadoSolicitud.PENDIENTE,
    usuario: pasajero2,
    viaje: viaje1,
  } as any);

  em.create(SolicitudViaje, {
    solViajeFecha: new Date('2026-04-22'),
    estadoSolicitud: EstadoSolicitud.PENDIENTE,
    usuario: pasajero1,
    viaje: viaje2,
  } as any);

  em.create(SolicitudViaje, {
    solViajeFecha: new Date('2026-04-23'),
    estadoSolicitud: EstadoSolicitud.PENDIENTE,
    usuario: pasajero2,
    viaje: viaje2,
  } as any);
  console.log('✅ 4 solicitudes de viaje creadas (2 por cada viaje).');

  await em.flush();
}
