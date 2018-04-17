/*global __base*/
/*global __logging*/

const _ = require('lodash/core');

function IsRequiredAndSet(required, field) {

  if (_.isBoolean(required) && required === true && _.isUndefined(field)) {

    return false;

  }

  return true;

}

function IsValidType(type, field) {

  try {

    let ValidationModule = require(`${__base}/Common/Validation/${type}`);
    let validationModule = new ValidationModule();

    return validationModule.ValidateType(field);

  }

  catch(e) {

    throw e;

  }

}

function StripUnrequiredParameters(requiredParams = {}, listToFilter = {}) {

  let filtered = {};

  Object.entries(requiredParams).forEach( ([field]) => {

    filtered[field] = listToFilter[field];

  });

  return filtered;

}

async function ValidateBody(route, req) {

  let errors = [];

  if (!_.isObject(route.routeParameters)) {

    return [null, req];

  }

  Object.entries(route.routeParameters).forEach( ([name, constraints]) => {

    if (!_.isObject(constraints)) {

      return;

    }

    if (!IsRequiredAndSet(constraints.required, req.queryParams[name])) {

      errors.push(`${name} is a required parameter`);
      return;

    }

    if (_.isUndefined(req.queryParams[name])) {

      return;

    }

    try {

      let isValueValid;
      [isValueValid, req.queryParams[name]] = IsValidType(constraints.type, req.queryParams[name]);

      if (!isValueValid) {

        errors.push(`${name} is not a valid ${constraints.type}`);
        return;

      }

    }

    catch(e) {

      __logging.error(e);
      return false;

    }

  });

  if (errors.length > 0) {

    return [errors, req];

  }

  req.queryParams = StripUnrequiredParameters(route.routeParameters, req.queryParams);
  return [null, req];

}

module.exports = ValidateBody;
