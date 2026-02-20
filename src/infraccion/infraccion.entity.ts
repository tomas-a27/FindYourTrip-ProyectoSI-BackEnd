import { Entity, Property, ManyToOne, OneToOne, PrimaryKey} from '@mikro-orm/core';
import { Calificacion } from '../calificacion/calificacion.entity.js';

@Entity()
export class Infraccion {
    @PrimaryKey()
    idInfraccion!: number

    @Property()
    comentarioInfraccion?: string

    @Property()
    descripcionInfraccion?: string

    @Property()
    infraccionFecha!: Date

    @Property()
    calificacionTipo!: string


    //@OneToOne({entity: ()=>Calificacion, owner: true, unique: true} )
    @OneToOne(()=>Calificacion, {owner:true, unique:true})
    calificacion!: Calificacion

}