import { Entity, Property, ManyToOne, PrimaryKey} from '@mikro-orm/core';
import { Usuario } from '../usuario/usuario.entity.js';
import { Viaje } from '../viaje/viaje.entity.js';

@Entity()
export class Calificacion {
    @PrimaryKey()
    idCalificacion?: number

    @Property()
    calificacionTipo!: string

    @Property()
    calificacionValoracionLikert!: number

    @Property({ nullable: true })
    comentarioCalificacion?: string

    @ManyToOne(() => Usuario)
    usuarioCalificador!: Usuario;

    @ManyToOne(()=>Usuario)
    usuarioCalificado!: Usuario;

    @ManyToOne(()=> Viaje)
    viaje!: Viaje
}