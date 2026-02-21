import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '../shared/db/baseEntity.entity.js';

@Entity()
export class Localidad extends BaseEntity {
  @Property({ nullable: false, unique: true })
  codPostal!: string;

  @Property({ nullable: false })
  nombre!: string;
}
