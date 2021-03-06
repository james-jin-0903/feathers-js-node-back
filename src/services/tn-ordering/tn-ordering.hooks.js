const { authenticate } = require('@feathersjs/authentication').hooks;
const checkPermissions = require('feathers-permissions');
const {iff, isProvider, disallow} = require('feathers-hooks-common');
const {roleToString} = require('../../global-hooks/global-hooks.auth');
const {validateQueryString} = require('./hooks');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      iff(isProvider('external'), roleToString()),
      checkPermissions({roles: ['1', '3'], entity: 'user', field: 'userRole'}),
    ],
    find: [
      validateQueryString()
    ],
    get: [disallow('external', 'server')],
    create: [disallow('external', 'server')],
    update: [disallow('external', 'server')],
    patch: [disallow('external', 'server')],
    remove: [disallow('external', 'server')]
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
