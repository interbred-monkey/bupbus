/*global __logging*/
/*global __formatError*/

let _       = require('lodash/core'),
    request = require('request');

function Curl(requestParameters = {}) {

  return new Promise( (resolve, reject) => {

    let errors = ValidateRequestParameters(requestParameters);

    if (!_.isNull(errors)) {

      return [errors];

    }

    requestParameters.method = requestParameters.method.toUpperCase();

    request(requestParameters, async (e, r, b) => {

      let errors = CheckForErrors(e, r);

      if (!_.isNull(errors)) {

        __logging.error(e);
        return reject(errors);

      }

      if (_.isString(requestParameters.returnType) && requestParameters.returnType === 'JSON') {

        try {

          b = JSON.parse(b);
          return resolve(b);

        }

        catch(e) {

          __logging.error(e);
          return reject(e.message);

        }

      }

    });

  });

}

function CheckForErrors(err, res) {

  if (!_.isNull(err)) {

    return [new Error('unable to complete request'), err];

  }

  if (!_.isObject(res) || !_.isNumber(res.statusCode)) {

    return __formatError('unknown error returned from curl library');

  }

  if (res.statusCode !== 200 && res.statusCode !== 201) {

    return __formatError(`http request returned the error code ${res.statusCode}`);

  }

  return null;

}

function ValidateRequestParameters(params) {

  let errors  = [],
      methods = [
        'POST',
        'GET',
        'PATCH',
        'PUT',
        'DELETE'
      ];

  if (!_.isString(params.method)) {

    errors.push('method is a required parameter');

  }

  if (!methods.includes(params.method.toUpperCase())) {

    errors.push(`method should be one of ${methods.join(', ')}`);

  }

  if (!_.isString(params.uri) || _.isEmpty(params.uri)) {

    errors.push('uri is a required parameter');

  }

  if (errors.length > 0) {

    return errors;

  }

  return null;

}

module.exports = Curl;
