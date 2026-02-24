import {
  Entity,
  Property,
  ManyToOne,
  Collection,
  ManyToMany,
  PrimaryKey,
} from '@mikro-orm/core';
import { Infraccion } from '../infraccion/infraccion.entity.js';
import { Sancion } from './sancion.entity.js';
@Entity()
export class SancionInfraccion {
  @PrimaryKey()
  idSancionInfraccion!: number;

  @ManyToOne(() => Sancion, { nullable: false })
  sancion!: Sancion;

  @ManyToMany({ entity: () => Infraccion, owner: true })
  infracciones = new Collection<Infraccion>(this);
}
