let _ = require('lodash/core');

class Boolean {

  ValidateType(value) {

    switch(value) {

      case 'true':
        value = true;
        break;

      case 'false':
        value = false;
        break;

      default:
        value = null;

    }

    return [_.isBoolean(value), value];

  }

}

module.exports = Boolean;