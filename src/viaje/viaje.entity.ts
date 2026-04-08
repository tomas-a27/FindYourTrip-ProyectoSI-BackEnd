import { Entity, Property, ManyToOne, PrimaryKey, OneToMany, Collection } from '@mikro-orm/core';
import { Vehiculo } from '../usuario/vehiculo.entity.js';
import type { SolicitudViaje } from './solicitudViaje.entity.js';
import { Usuario } from '../usuario/usuario.entity.js';
import { Localidad } from '../localidad/localidad.entity.js';

@Entity()
export class Viaje {
  @PrimaryKey()
  viajeId!: number;

  @Property({ type: 'date' })
  viajeFecha!: string;

  @Property({ type: 'time' })
  viajeHorario!: string;

  @Property()
  viajeCantLugares!: number;

  @Property()
  viajeEstado!: string;

  @Property()
  viajeComentario?: string;

  @Property()
  viajeAceptaMascotas!: boolean;

  @Property()
  viajePrecio!: number;

  @Property({ nullable: true })
  cancelacionTardia?: boolean;

  @ManyToOne(() => Vehiculo)
  vehiculo!: Vehiculo;

  @ManyToOne(() => Usuario)
  usuarioConductor!: Usuario;

  @ManyToOne(() => Localidad, { nullable: false })
  viajeOrigen!: Localidad;

  @ManyToOne(() => Localidad, { nullable: false })
  viajeDestino!: Localidad;

  @OneToMany(() => 'SolicitudViaje', (solicitud: any) => solicitud.viaje)
  solicitudes = new Collection<SolicitudViaje>(this);
}
