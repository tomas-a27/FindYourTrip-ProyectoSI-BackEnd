export enum TipoDocumento {
  DNI = 'DNI',
  PASAPORTE = 'Pasaporte',
  CUIT = 'CUIT',
  CI = 'CI',
  ERRO = 'ERRO',
  LC = 'LC',
  LE = 'LE',
  LEM = 'LEM',
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
  PREFIERO_NO_DECIRLO = 'Prefiero no decirlo',
}

export enum EstadoSolicitud {
  PENDIENTE = 'Pendiente',
  APROBADA = 'Aprobada',
  DENEGADA = 'Denegada',
  CANCELADA = 'Cancelada',
}

export enum EstadoViaje {
  PENDIENTE = 'pendiente',
  EN_CURSO = 'enCurso',
  FINALIZADO = 'finalizado',
  CANCELADO = 'cancelado',
}
