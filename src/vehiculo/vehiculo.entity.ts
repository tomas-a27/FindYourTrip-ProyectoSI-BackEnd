import {Entity, PrimaryKey, Property, ManyToOne} from '@mikro-orm/core'
import { Usuario } from '../usuario/usuario.entity.js'

@Entity()
export class Vehiculo {

    @PrimaryKey()
    patente!: string

    @Property()
    modelo!: string

    @Property()
    cantLugares!: number

    @Property()
    color!: string

    @Property()
    marca!: string


    @ManyToOne(()=>Usuario, {nullable:false})
    usuario!: Usuario

}