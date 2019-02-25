const dynamo = require('./dynamo');
const { PACKAGE_NAME } = require('..');

const DEFAULT_TYPE = 'dynamo';

const checkPluginCompatibility = (plugin) => {
  const { plugins = [] } = plugin.serverless.service;

  if (plugins.includes('serverless-dynamodb-local')) {
    if (plugins.indexOf('serverless-dynamodb-local') < plugins.indexOf(PACKAGE_NAME)) {
      plugin.log(`\n\nWARNING!!! Found serverless-dynamodb-local before ${PACKAGE_NAME}.\n\nTo ensure compatibility, please list ${PACKAGE_NAME} before serverless-dynamodb-local in your plugins list`);
    }
    Object.assign(plugin.hooks, {
      // Hooks https://github.com/99xt/serverless-dynamodb-local
      'before:dynamodb:migrate:migrateHandler': () => this.spawn('process'),
      'before:dynamodb:start:startHandler': () => this.spawn('process'),
      'before:offline:start:init': () => this.spawn('process'),
    });
  }
};

module.exports = {
  DEFAULT_TYPE,
  checkPluginCompatibility,
  dynamo,
};
