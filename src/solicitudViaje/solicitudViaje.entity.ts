import { Entity, Property, ManyToOne, PrimaryKey} from '@mikro-orm/core';
import { Usuario } from '../usuario/usuario.entity.js';
import { Viaje } from '../viaje/viaje.entity.js';

@Entity()
export class SolicitudViaje {
    @PrimaryKey()
    solViajeId!: number

    @Property()
    solViajeFecha!: Date

    @Property()
    estadoSolicitud!: string

    @ManyToOne(()=> Usuario)
    usuario!: Usuario

    @ManyToOne(()=>Viaje)
    viaje!: Viaje
}