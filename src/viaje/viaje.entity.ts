import { Entity, Property, ManyToOne, PrimaryKey } from '@mikro-orm/core';
import { Vehiculo } from '../usuario/vehiculo.entity.js';
import { Usuario } from '../usuario/usuario.entity.js';
import { Localidad } from '../localidad/localidad.entity.js';

@Entity()
export class Viaje {
  @PrimaryKey()
  viajeId!: number;

  @Property()
  viajeFecha!: Date;

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

  @ManyToOne(() => Vehiculo)
  vehiculo!: Vehiculo;

  @ManyToOne(() => Usuario)
  usuarioConductor!: Usuario;

  @ManyToOne(() => Localidad, { nullable: false })
  viajeOrigen!: Localidad;

  @ManyToOne(() => Localidad, { nullable: false })
  viajeDestino!: Localidad;
}
