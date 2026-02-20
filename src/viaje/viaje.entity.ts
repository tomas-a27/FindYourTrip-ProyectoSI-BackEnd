import { Entity, Property, ManyToOne, PrimaryKey} from '@mikro-orm/core';
import { Vehiculo } from '../vehiculo/vehiculo.entity.js';
import { Usuario } from '../usuario/usuario.entity.js';

@Entity()
export class Viaje {
    @PrimaryKey()
    viajeId!: number

    @Property()
    viajeFecha!: Date

    @Property({ type: 'time' })
    viajeHorario!: string

    @Property()
    viajeCantLugares!: number

    @Property()
    viajeEstado!: string

    @Property()
    viajeComentario?: string

    @Property()
    viajeAceptaMascotas!: boolean

    @Property()
    viajePrecio!: number

    @ManyToOne(()=>Vehiculo)
    vehiculo!: Vehiculo

    @ManyToOne(()=>Usuario)
    usuarioConductor!: Usuario

    //localidad

}