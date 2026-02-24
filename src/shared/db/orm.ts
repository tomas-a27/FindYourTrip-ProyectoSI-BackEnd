import { MikroORM } from '@mikro-orm/core';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { MySqlDriver } from '@mikro-orm/mysql';
import 'dotenv/config';

export const orm = await MikroORM.init({
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  dbName: 'findyourtripDB',
  driver: MySqlDriver, //me pide usar esto
  clientUrl: `mysql://root:${process.env.DB_PASSWORD}@localhost:3306/findyourtripDB`,
  highlighter: new SqlHighlighter(),
  debug: true,
  schemaGenerator: {
    //never in production
    disableForeignKeys: true,
    createForeignKeyConstraints: true,
    ignoreSchema: [],
  },
});

export const syncSchema = async () => {
  const generator = orm.getSchemaGenerator();
    
  await generator.dropSchema()
  await generator.createSchema()

  await generator.updateSchema();
};
