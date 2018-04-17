/*global __base*/
/*global __logging*/

const Middleware = require(`${__base}/PubSub/Middleware.js`);
const Router = require(`${__base}/PubSub/Router.js`);

class PubSub {

  constructor () {

    this.Library    = 'nats';
    this.Module     = require(this.Library).connect(this.GetConnectionParams());
    this.Queue      = process.env.PUBSUB_MESSAGE_QUEUE || '';

    this.AddConnectionHandler();

  }

  GetConnectionParams() {

    let serverAddresses = process.env.PUBSUB_SERVERS.split(',').map((serverAddress) => {

      return `nats://${serverAddress.trim()}:${process.env.PUBSUB_PORT}`;

    });

    return {
      servers: serverAddresses
    };

  }

  AddConnectionHandler() {

    this.Module.on('error', (e) => {

      __logging.error(e);
      throw e;

    });

  }

  async Start() {

    try {

      let middleware = new Middleware(this.Module);
      let router = new Router(this.Module, this.Queue, `${__base}/PubSub/Routes`, `${__base}/PubSub/Controllers`);
      await router.Load();
      await middleware.Load();
      middleware.AddRouteConfig(router.RoutesConfig);
      middleware.Apply();
      router.Apply();

    }

    catch(e) {

      throw e;

    }

  }

}

module.exports = PubSub;