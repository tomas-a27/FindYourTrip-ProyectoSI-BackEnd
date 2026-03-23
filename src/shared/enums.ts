export enum TipoDocumento {
  DNI = 'DNI',
  PASAPORTE = 'Pasaporte',
  LC = 'LC',
  LE = 'LE',
  CPI = 'CPI',
}

export enum EstadoUsuario {
  HABILITADO = 'habilitado',
  INHABILITADO = 'inhabilitado',
}

export enum EstadoConductor {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado', //chequear si era asi
  DENEGADO = 'denegado',
}

export enum TipoUsuario {
  PASAJERO = 'pasajero',
  CONDUCTOR = 'conductor',
  ADMINISTRADOR = 'administrador',
}

export enum GeneroUsuario {
  MASCULINO = 'Masculino',
  FEMENINO = 'Femenino',
  OTRO = 'Otro',
}

export enum EstadoSolicitud {
  PENDIENTE = 'Pendiente',
  APROBADA = 'Aprobada',
  DENEGADA = 'Denegada',
  CANCELADA = 'Cancelada',
}
