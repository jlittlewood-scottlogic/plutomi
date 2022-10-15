import { Options } from '@mikro-orm/core';
import { MongoHighlighter } from '@mikro-orm/mongo-highlighter';
import { MongoDriver } from '@mikro-orm/mongodb';
import { Opening, Org, Stage, User, UserLoginLink } from './entities';
import { env } from './env';

const mikroOrmOptions: Options<MongoDriver> = {
  type: 'mongo',
  entities: [User, Org, UserLoginLink, Stage, Opening],
  dbName: env.deploymentEnvironment ?? process.env.DEPLOYMENT_ENVIRONMENT,
  highlighter: new MongoHighlighter(),
  debug: true,
  ensureIndexes: true,
  pool: {
    min: 20,
    max: 50,
  },
  clientUrl: env.mongoConnection,
};

console.log(`Mikro orm options`, mikroOrmOptions);
export default mikroOrmOptions;
