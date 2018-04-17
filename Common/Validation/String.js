let _ = require('lodash/core');

class String {

  ValidateType(value) {

    return [_.isString(value), value];

  }

}

module.exports = String;