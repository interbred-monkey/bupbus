/*global __logging*/

const _             = require('lodash/core'),
      fs            = require('fs'),
      yaml          = require('js-yaml');

class Routes {

  constructor(routesDir, controllerDir, routesPrefix = '') {

    this.RoutesPrefix = routesPrefix;
    this.RoutesDir = routesDir;
    this.ControllerDir = controllerDir;
    this.RoutesConfig;
    return;

  }

  async Load() {

    try {

      let dirList = await this.ListDir();
      this.RoutesConfig = await this.LoadRoutesConfigFromFiles(dirList);
      this.PrefixUris();
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

  PrefixUris() {

    if (this.RoutesPrefix === '') {

      return;

    }

    try {

      Object.entries(this.RoutesConfig).forEach( ([key]) => {

        this.RoutesConfig[key].uri = `${this.RoutesPrefix}${this.RoutesConfig[key].uri}`;

      });

      return;

    }

    catch(e) {

      throw e;

    }

  }

  ValidateRouteConfig(route) {

    if (!_.isObject(route) || !_.isString(route.method) ||
        !_.isString(route.uri) || !_.isString(route.controller) ||
        !_.isString(route.handler)) {

      return false;

    }

    return true;

  }

  async Apply(module) {

    if (!_.isObject(this.RoutesConfig)) {

      return;

    }

    Object.values(this.RoutesConfig).map( (route, key) => {

      if (!this.ValidateRouteConfig(route)) {

        throw new Error(`Invalid route configuration provided for ${key}`);

      }

      module[route.method.toLowerCase()](route.uri, async (req, res) => {

        try {

          let Controller = require(`${this.ControllerDir}/${route.controller}`),
              controller = new Controller(),
              [error, response, redirectUri] = await controller[route.handler](req.body);

          return this.SendResponse(res, route.method, error, response, redirectUri);

        }

        catch(e) {

          __logging.error(e);
          return res.status(500).send();

        }

      });

    });

    return;

  }

  SendResponse(res, method, error, body, redirectUri = null) {

    if (_.isString(redirectUri) && !_.isEmpty(redirectUri)) {

      // add validation
      return res.redirect(redirectUri);

    }

    let code = this.GenerateResponseCode(method, (!_.isNull(error)?true:false));

    if (_.isObject(error)) {

      body = {
        error: error.message || 'An unknown error occurred'
      };

    }

    return res.status(code).send(body);

  }

  GenerateResponseCode(method, error) {

    switch (method) {

      case 'POST':
        return (error?404:201);

      case 'GET':
      case 'PUT':
      case 'PATCH':
      case 'DELETE':
        return (error?404:200);

    }

  }

  AddStaticFiles(library, module, directory = null) {

    if (_.isNull(directory)) {

      return;

    }

    try {

      module.use(require(library).static(directory));
      return;

    }

    catch(e) {

      throw e;

    }

  }

  AddDefaultMissingResponse(module) {

    module.use((req, res, next) => {

      if (res.headersSent) {

        return next();

      }

      return res.status(404).send();

    });

  }

  AddMissingPage(module, file = null) {

    if (_.isNull(file)) {

      return;

    }

    if (!fs.existsSync(file)) {

      throw new Error(`Missing page does not exist at path ${file}`);

    }

    try {

      module.use((req, res, next) => {

        if (res.headersSent) {

          return next();

        }

        return res.status(404).sendFile(file);

      });

    }

    catch(e) {

      throw e;

    }

  }

  AddErrorPage(module, file = null) {

    if (_.isNull(file)) {

      return;

    }

    if (!fs.existsSync(file)) {

      throw new Error(`Error page does not exist at path ${file}`);

    }

    try {

      module.use((error, req, res, next) => {

        if (res.headersSent) {

          return next(error);

        }

        return res.status(500).sendFile(file);

      });

    }

    catch(e) {

      throw e;

    }

  }

}

module.exports = Routes;