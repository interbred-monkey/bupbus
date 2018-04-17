let lurl = require('lurl');

class Uri {

  ValidateType(value) {

    return [lurl(value), value];

  }

}

module.exports = Uri;