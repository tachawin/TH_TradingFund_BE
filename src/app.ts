/* eslint-disable no-unused-vars */
/* eslint-disable no-new */
import fastify, { FastifyInstance, FastifyPluginOptions } from 'fastify';

import AWSAdapter from './adapters/aws.adapter';
import BullMQAdapter from './adapters/bullmq.adapter';
import MongoAdapter from './adapters/mongo.adapter';
import RedisAdapter from './adapters/redis.adapter';

import config from './config/config';

class App {
  public app: FastifyInstance;

  private app_domain: string = config.app.domain;
  private app_environment: string = config.app.kind;
  private app_port: number = parseInt(`${config.app.port}`, 10) ?? 8080;
  private app_ip: string = config.app.ip;

  private fastify_config = {
    logger: {
      prettyPrint:
        this.app_environment === 'development'
          ? {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          }
          : false,
    },
  };

  constructor(appInit: { plugins: FastifyPluginOptions[]; routes: any }) {
    this.app = fastify(this.fastify_config);

    this.connectAdapter();

    this.register(appInit.plugins);
    this.routes(appInit.routes);
  }

  private async connectAdapter() {
    new MongoAdapter();

    RedisAdapter.getInstance();
    AWSAdapter.getInstance();
    BullMQAdapter.getInstance();
  }

  private register(plugins: { forEach: (arg0: (plugin: any) => void) => void }) {
    plugins.forEach((plugin) => {
      this.app.register(plugin);

      console.info(`[App.plugins]: register ${plugin.name} plugin successfully 📌`);
    });
  }

  public routes(routes: { forEach: (arg0: (Route: any) => void) => void }) {
    this.app.get('/healthcheck', async (request, reply) => { reply.send({ healthcheck: 'server is alive ✅' }); });

    routes.forEach((Route) => {
      const router = new Route();
      this.app.register(router.routes, { prefix: router.prefix_route });

      console.info(`[App.routes]: setup ${router.constructor.name} route successfully ✨`);
    });
  }

  public listen() {
    this.app.listen(this.app_port, this.app_ip, () => {
      console.info('[App.listen]: Admin Server 🚀');
      console.info(`[App.listen]: Listening on the http://${this.app_domain}:${this.app_port} 🌟`);
      console.info(`[App.listen]: Working on ${this.app_environment.toUpperCase()} ENVIRONMENT 👻`);
    });
  }
}

export default App;
