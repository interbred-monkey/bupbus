/*global __base*/

const TestModel   = require(`${__base}/Services/Models/TestModel.js`),
      testModel   = new TestModel();

class TestService {

  constructor() {}

  async Add(someData) {

    let [error, model] = await testModel.Create(someData);

    return [error, model];

  }

}

module.exports = TestService;