import { Entity, PrimaryKey, Property, ManyToOne} from '@mikro-orm/core';
import crypto from 'crypto';

@Entity()
export class Usuario {

    @PrimaryKey()
    idUsuario!: number

    @Property()
    tipoUsuario!: string

    @Property()
    nombreUsuario!: string

    @Property()
    apellidoUsuario!: string

    @Property()
    tipoDocumento!: string

    @Property()
    nroDocumento!: string

    @Property({ unique: true, nullable: false })
    email!: string

    @Property()
    telefono!: number

    @Property({hidden:true, lazy:true})
    contraseñaUsuario!: string //seguridad

    @Property()
    generoUsuario!: string

    @Property()
    calificacionPas?: number

    @Property()
    estadoUsuario!: string

    @Property()
    nroLicenciaConductorUsuario?: string

    @Property()
    vigenciaLicenciaConductorUsuario?: Date

    @Property({ type: 'blob', nullable: true })
    fotoLicenciaConductorUsuario?: Buffer 

    @Property()
    calificacionConductor?: number

    @Property()
    estadoConductor?: string

    @Property({ type: 'blob', nullable: true })
    fotoPerfil?: Buffer


    static hashPassword(password: string) {
    return crypto.createHmac('sha256', password).digest('hex');
    }

}