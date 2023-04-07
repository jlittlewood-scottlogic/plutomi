import * as dotenv from 'dotenv';
dotenv.config();

import helmet from 'helmet';
import express from 'express';
import cors from 'cors';
import timeout from 'connect-timeout';
import withCleanOrgId from './OLD/middleware/withCleanOrgId';
import withCleanQuestionId from './OLD/middleware/withCleanQuestionId';
import withCleanWebhookId from './OLD/middleware/withCleanWebhookId';
import { COOKIE_SETTINGS, IS_LIVE, WEBSITE_URL } from './Config';
import next from 'next';
import { openings } from './OLD/routes/openings';
import { orgs } from './OLD/routes/orgs';
import { questions } from './OLD/routes/questions';
import { webhooks } from './OLD/routes/webhooks';
import { users } from './OLD/routes/users';
import { stages } from './OLD/routes/stages';
import { invites } from './OLD/routes/invites';
import { publicInfo } from './OLD/routes/public';
import { auth } from './OLD/routes/auth';
import { applicants } from './OLD/routes/applicants';
import { envVars } from './env';
import { connectToDatabase } from './OLD/utils/connectToDatabase';
import API from './controllers';

const morgan = require('morgan');
const cookieParser = require('cookie-parser');

console.log(`NODE NEV`, envVars.NODE_ENV);
const dev = envVars.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(async () => {
    const morganSettings = envVars.NODE_ENV === 'development' ? 'dev' : 'combined';
    const sessionSecrets = [envVars.SESSION_SIGNATURE_SECRET_1];

    const server = express();

    server.use(async (req, res, next) => {
      const { client, items } = await connectToDatabase();

      req.mongoClient = client;
      req.items = items;
      next();
    });

    server.use(timeout('5s'));
    server.use(
      cors({
        credentials: true,
        origin: WEBSITE_URL,
      }),
    );

    server.set('trust proxy', 1);

    // TODO
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    // server.use(API.Misc.haltOnTimeout);
    server.use('/api', [
      express.json(),
      helmet(),
      withCleanOrgId, // TODO make these all one middleware
      withCleanQuestionId,
      withCleanWebhookId,
      morgan(morganSettings),
      cookieParser(sessionSecrets, COOKIE_SETTINGS),
    ]);

    // Run jest setup if locally testing
    // if (envVars.NODE_ENV === 'development' && !IS_LIVE) {
    //   server.post('/jest-setup', API.Misc.jestSetup);
    // }

    server.get('/api', API.Misc.healthCheck);

    // Routers
    server.use('/api/openings', openings);
    server.use('/api/orgs', orgs);
    server.use('/api/questions', questions);
    server.use('/api/webhooks', webhooks);
    server.use('/api/users', users);
    server.use('/api/stages', stages);
    server.use('/api/invites', invites);
    server.use('/api/public', publicInfo);
    server.use('/api/auth', auth);
    server.use('/api/applicants', applicants);

    // Nextjs
    server.get('/*', (req, res) => {
      return handle(req, res);
    });

    server.listen(envVars.PORT, () => {
      console.log(`Server running on http://localhost:${envVars.PORT}`);
    });
  })
  .catch((error) => {
    console.error(`App crashed`, error);
  });
