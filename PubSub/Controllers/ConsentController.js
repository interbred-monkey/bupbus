/*global __base*/
/*global __formatError*/

const ConsentService = require(`${__base}/Services/ConsentService.js`);

class ConsentController {

  constructor() {}

  async postConsent(params) {

    try {

      let consentService = new ConsentService();
      let [error, model] = await consentService.CreateConsent(params);

      return [error, model];

    }

    catch(e) {

      return __formatError('An unknown error has occured');

    }

  }

  async getOriginConsent() {

    return [null, {'some': 'consent'}];

  }

}

module.exports = ConsentController;