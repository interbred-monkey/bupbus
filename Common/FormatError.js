const {isNull} = require('lodash/core');

function FormatError(error) {

  return [isNull(error)?error:new Error(error)];

}

module.exports = FormatError;