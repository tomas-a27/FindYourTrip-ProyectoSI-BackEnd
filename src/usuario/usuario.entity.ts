import { Entity, PrimaryKey, Property, OneToMany, Cascade, Collection, Enum} from '@mikro-orm/core';
import { Vehiculo } from '../vehiculo/vehiculo.entity.js';
import { EstadoUsuario, TipoDocumento } from '../shared/enums.js'
import crypto from 'crypto';


@Entity()
export class Usuario {

    @PrimaryKey()
    idUsuario!: number

    @Property({default: 'Pasajero'})
    tipoUsuario!: string

    @Property()
    nombreUsuario!: string

    @Property()
    apellidoUsuario!: string

    @Enum({ items: () => TipoDocumento })
    tipoDocumento!: string

    @Property()
    nroDocumento!: string

    @Property({ unique: true, nullable: false })
    email!: string

    @Property()
    telefono!: string

    @Property({hidden:true, lazy:true})
    contrasenaUsuario!: string //seguridad

    @Property()
    generoUsuario!: string

    @Property({ nullable: true })
    calificacionPas?: number

    @Enum({ items: () => EstadoUsuario, default: EstadoUsuario.HABILITADO})
    estadoUsuario!: string

    @Property({ nullable: true })
    nroLicenciaConductorUsuario?: string

    @Property({ nullable: true })
    vigenciaLicenciaConductorUsuario?: Date

    @Property({ type: 'blob', nullable: true })
    fotoLicenciaConductorUsuario?: Buffer 

    @Property({ nullable: true })
    calificacionConductor?: number

    @Property({ nullable: true })
    estadoConductor?: string

    @Property({ type: 'blob', nullable: true })
    fotoPerfil?: Buffer


    @OneToMany(()=> Vehiculo, vehiculo => vehiculo.usuario, {cascade: [Cascade.ALL]})
    vehiculos= new Collection<Vehiculo>(this)

    static hashPassword(password: string) {
    return crypto.createHmac('sha256', password).digest('hex');
    }

}