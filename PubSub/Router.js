/*global __logging*/
/*global __formatError*/

const _             = require('lodash/core'),
      fs            = require('fs'),
      yaml          = require('js-yaml');

class Routes {

  constructor(module, queue, routesDir, controllerDir) {

    this.Module = module;
    this.Queue = queue;
    this.RoutesDir = routesDir;
    this.ControllerDir = controllerDir;
    this.RoutesConfig;
    return;

  }

  async Load() {

    try {

      let dirList = await this.ListDir();
      this.RoutesConfig = await this.LoadRoutesConfigFromFiles(dirList);
      return;

    }

    catch(e) {

      throw e;

    }

  }

  ListDir() {

    return new Promise( (resolve) => {

      fs.readdir(this.RoutesDir, (err, files) => {

        if (!_.isNull(err)) {

          return resolve([]);

        }

        return resolve(files.map( (f) => {

          if (!f.match(/\.yaml|\.yml/gi)) {

            return;

          }

          return `${this.RoutesDir}/${f}`;

        }));

      });

    });

  }

  async LoadRoutesConfigFromFiles(dirList) {

    if (!_.isArray(dirList)) {

      return {};

    }

    let routesConfig = {};

    dirList.map( (path) => {

      try {

        Object.assign(routesConfig, yaml.safeLoad(fs.readFileSync(path, 'utf8')));

      }

      catch(e) {

        throw e;

      }

    });

    return routesConfig;

  }

  ValidateRouteConfig(route) {

    if (!_.isObject(route) || !_.isString(route.subject) ||
        !_.isString(route.controller) || !_.isString(route.method) ||
        !_.isString(route.handler)) {

      return false;

    }

    return true;

  }

  GenerateMessageSubject(route) {

    return `${route.method.toLowerCase()}.${this.Queue}.${route.subject.replace(/:[a-zA-Z0-9_]+/g, '*')}`;

  }

  Apply() {

    if (!_.isObject(this.RoutesConfig)) {

      throw __formatError('Missing routes configuration');

    }

    Object.values(this.RoutesConfig).map( (route, key) => {

      if (!this.ValidateRouteConfig(route)) {

        throw new Error(`Invalid route configuration provided for ${key}`);

      }

      route.processedSubject = this.GenerateMessageSubject(route);

      this.Module.subscribe(route.processedSubject, {queue: this.Queue}, async (req, replyTo) => {

        try {

          let Controller = require(`${this.ControllerDir}/${route.controller}`),
              controller = new Controller(),
              [error, response] = await controller[route.handler](req.queryParams);

          let res = this.GenerateResponse(route, req, error, response);

          return this.SendResponse(replyTo, res);

        }

        catch(e) {

          __logging.error(e);
          return this.SendResponse(replyTo, e);

        }

      });

    });

    return;

  }

  SendResponse(replyTo, response) {

    return this.Module.publish(replyTo, JSON.stringify(response));

  }

  GenerateResponse(route, req, err, body) {

    if (!_.isNull(err)) {

      body = {
        error: err.message || err
      };

    }

    req.responseStatusCode = this.GenerateStatusCode(err, route.method);

    try {

      req.responseBody = JSON.stringify(body);

    }

    catch(e) {

      req = this.GenerateInternalError(req);
      __logging.error(e);

    }

    return req;

  }

  GenerateStatusCode(err, method) {

    switch (method) {

      case 'POST':
        return (err?404:201);

      case 'GET':
      case 'PUT':
      case 'PATCH':
      case 'DELETE':
        return (err?404:200);

    }

  }

  GenerateInternalError(req) {

    req.responseStatusCode = 500;
    req.responseBody = JSON.stringify({errors: ['An unknown error occurred. Please contact support.']});

    return req;

  }

}

module.exports = Routes;