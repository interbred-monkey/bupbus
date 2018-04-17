/*global __db*/
/*global __logging*/
/*global __formatError*/

const _       = require('lodash/core'),
      uuid    = require('uuid/v4'),
      moment  = require('moment'),
      db      = __db;

class BaseModel {

  constructor() {}

  async CreateDBConnection(collection) {

    await db.UseCollection(collection);

    return;

  }

  CreateEntityFromModel(model) {

    let id = (_.isString(model.Id)?model.Id:uuid());

    delete model.Id;

    let entity = {
      _id:id,
      CreatedUtc: moment().utc().toISOString(),
      ModifiedUtc: moment().utc().toISOString(),
      ...model
    };

    return entity;

  }

  async Insert(collection, entity) {

    try {

      let error = null;
      [error] = await db.Insert(collection, entity);

      return [error, entity];

    }

    catch(e) {

      __logging.error(e);
      return __formatError('An unknown error occurred');

    }

  }

  async BulkInsert(collection, entities) {

    try {

      let error = null;
      [error] = await db.BulkInsert(collection, entities);

      return [error, entities];

    }

    catch(e) {

      __logging.error(e);
      return __formatError('An unknown error occurred');

    }

  }

  async Get(collection, query) {

    try {

      let [error, entity] = await db.Get(collection, query);
      return [error, entity];

    }

    catch(e) {

      __logging.error(e);
      return __formatError('An unknown error occurred');

    }

  }

  async Search(collection, query) {

    try {

      let [error, entities] = await db.Search(collection, query);
      return [error, entities];

    }

    catch(e) {

      __logging.error(e);
      return __formatError('An unknown error occurred');

    }

  }

  async Update(collection, query, entity) {

    try {

      entity.ModifiedUtc = moment().utc().format('YYYY-M-D HH:mm:ss');

      let [error] = await db.Update(collection, query, entity);

      return [error, entity];

    }

    catch(e) {

      __logging.error(e);
      return __formatError('An unknown error occurred');

    }

  }

  async BulkUpdate(collection, queries, entities) {

    try {

      entities = entities.map( (entity) => {

        entity.ModifiedUtc = moment().utc().format('YYYY-M-D HH:mm:ss');
        return entity;

      });

      let [error] = await db.BulkUpdate(collection, queries, entities);

      return [error, entities];

    }

    catch(e) {

      __logging.error(e);
      return __formatError('An unknown error occurred');

    }

  }

  async Delete(collection, query) {

    try {

      let [error] = await db.Delete(collection, query);
      return [error];

    }

    catch(e) {

      __logging.error(e);
      return __formatError('An unknown error occurred');

    }

  }

  async BulkDelete(collection, query) {

    try {

      let [error] = await db.BulkDelete(collection, query);
      return [error];

    }

    catch(e) {

      __logging.error(e);
      return __formatError('An unknown error occurred');

    }

  }

}

module.exports = BaseModel;
