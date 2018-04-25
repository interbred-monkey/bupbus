/*global __base*/
/*global __logging*/
/*global __formatError*/

const _     = require('lodash/core'),
      fs    = require('fs');

class Middleware {

  constructor(module, customMiddlewareDir = '') {

    if (!_.isObject(module)) {

      throw __formatError('Error loading the module for middleware injection');

    }

    this.Module = module;
    this.CustomMiddlewareDir = customMiddlewareDir;
    this.CommonMiddlewareDir = `${__base}/PubSub/Middleware`;
    this.MiddlewareList = [];
    this.RoutesConfig;
    return;

  }

  AddRouteConfig(routesConfig = null) {

    this.RoutesConfig = routesConfig || {};
    return;

  }

  async Load() {

    try {

      let commonDirList   = await this.ListDir(this.CommonMiddlewareDir);
      let customDirList   = await this.ListDir(this.CustomMiddlewareDir);
      let predefinedList  = this.PredefinedList();

      this.MiddlewareList = [...predefinedList, ...commonDirList, ...customDirList];

      return;

    }

    catch(e) {

      throw e;

    }

  }

  ListDir(dir) {

    return new Promise( (resolve) => {

      fs.readdir(dir, async (err, files) => {

        if (!_.isNull(err)) {

          return resolve([]);

        }

        return resolve(files.map( (f) => {

          return require(`${dir}/${f}`);

        }));

      });

    });

  }

  Apply() {

    const fn        = this.Module.subscribe,
          _instance = this;

    this.Module.subscribe = function() {

      let args = Object.values(arguments);

      if (_.isFunction(args.slice(-1)[0])) {

        args = [...args.slice(0, args.length - 1), _instance.InjectMiddleware(args.slice(-1)[0])];

      }

      fn.apply(_instance.Module, args);

    };

  }

  InjectMiddleware(fn) {

    const _instance = this;

    return async (req, replyTo, subject) => {

      let parseError;
      [parseError, req] = this.ParseRequest(req);

      if (!_.isNull(parseError)) {

        this.SendErrorResponse(req, replyTo, parseError);
        return;

      }

      let route = _instance.FindRoute(subject);

      let errors = await Promise.all(
        _instance.MiddlewareList.map(
          async (mw) => {

            try {

              let err = null;
              [err, req] = await mw(route, req);

              return err;

            }

            catch(e) {

              return e;

            }

          }
        )
      );

      errors = _.compact(errors);

      if (!_.isEmpty(errors)) {

        this.SendErrorResponse(req, replyTo, errors);
        return;

      }

      return await fn(req, replyTo, subject);

    };

  }

  PredefinedList() {

    return [
      this.SetupSubjectParameterExtraction
    ];

  }

  ParseRequest(req) {

    try {

      req = JSON.parse(req);
      return [null, req];

    }

    catch(e) {

      __logging.error(__formatError(`Malformed request\nRequest parameters: ${req}`));

      return ['Malformed request parameters', req];

    }

  }

  SetupSubjectParameterExtraction(route, req) {

    if (!_.isObject(route)) {

      return [null, req];

    }

    let matches = route.subject.match(/:([a-z0-9_-]+)/g);

    if (!matches) {

      return [null, req];

    }

    let queue = (process.env.PUBSUB_MESSAGE_QUEUE?`.${process.env.PUBSUB_MESSAGE_QUEUE}`:''),
        regex = new RegExp(`^${route.method.toLowerCase()}${queue}.`, 'g');

    let requestSubjectBits = route.requestSubject.replace(regex, '').split('.');

    route.subject.split('.').map( (bit, index) => {

      if (!bit.match(/:([a-z0-9_-]+)/)) {

        return;

      }

      req.queryParams[bit.replace(':', '')] = requestSubjectBits[index];

    });

    return [null, req];

  }

  FindRoute(subject) {

    let routeConfig = null;

    Object.values(this.RoutesConfig).map((route) => {

      if (subject.match(route.processedSubject)) {

        routeConfig = route;
        routeConfig.requestSubject = subject;

      }

    });

    return routeConfig;

  }

  SendErrorResponse(req, replyTo, errors) {

    if (_.isString(errors)) {

      errors = [errors];

    }

    req.responseBody = JSON.stringify({errors: errors});
    req.responseStatusCode = 400;

    this.Module.publish(replyTo, JSON.stringify(req));

  }

}

module.exports = Middleware;
