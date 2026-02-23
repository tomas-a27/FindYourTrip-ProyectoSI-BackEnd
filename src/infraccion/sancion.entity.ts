import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { Usuario } from '../usuario/usuario.entity.js'

@Entity()
export class Sancion {

    @PrimaryKey()
    idSancion!: number

    @Property()
    sancionFechaIni!: Date

    @Property()
    sancionDescripcion?: string

    @Property()
    sancionFechaFin!: Date
    

    @ManyToOne(()=> Usuario, {nullable: false})
    usuario!: Usuario
}