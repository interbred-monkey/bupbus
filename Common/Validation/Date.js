let moment = require('moment');

class Date {

  ValidateType(value) {

    try {

      let calculatedDate = moment(value),
          dateValidated  = calculatedDate.isValid();
      return [dateValidated, (dateValidated?calculatedDate.utc().toISOString():null)];

    }

    catch(e) {

      return [false, null];

    }

  }

}

module.exports = Date;