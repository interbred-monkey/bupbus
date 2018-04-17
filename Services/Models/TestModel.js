/*global __base*/
/*global __logging*/
/*global __formatError*/

const _         = require('lodash/core'),
      BaseModel = require(`${__base}/Services/Models/BaseModel.js`);

class TestModel extends BaseModel {

  constructor() {

    super();

    this.CreateDBConnection('data');

  }

  CreateModel(id, someData) {

    return {
      Id: id,
      SomeData: someData
    };

  }

  CreateModelFromEntity(entity) {

    if (!_.isObject(entity)) {

      return {};

    }

    return {
      Id: entity._id,
      SomeData: entity.SomeData
    };

  }

  ApplyPatchToEntity(entity, patch) {

    (_.isString(patch.someData)?entity.SomeData = patch.someData:'');

    return entity;

  }

  async Create(someData = null) {

    try {

      let error           = null,
          model           = this.CreateModel(null, someData),
          entity          = this.CreateEntityFromModel(model);

      [error, entity] = await this.Insert('data', entity);
      model = this.CreateModelFromEntity(entity);

      return [error, model];

    }

    catch(e) {

      __logging.error(e);
      return __formatError('An unknown error occurred');

    }

  }

}

module.exports = TestModel;