
const { separateByType } = require('./utils');

const PLUGIN_NAME = 'tables';
const PACKAGE_NAME = `serverless-plugin-${PLUGIN_NAME}`;

const runTableSteps = (tableSteps = [], plugin, table) => (
  tableSteps.reduce((input, step) => step(plugin, table, input), null)
);

const runPostProcessSteps = (postProcessSteps = [], plugin, tables, processedTables) => (
  postProcessSteps.reduce((input, step) => step(plugin, tables, processedTables, input), null)
);

class TablesPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.provider = this.serverless.getProvider('aws');

    this.hooks = {
      'before:package:createDeploymentArtifacts': () => this.processTables(),
    };
  }

  log(...args) {
    const message = args.join(' ');
    this.serverless.cli.consoleLog(`${PACKAGE_NAME}: ${message}`);
  }

  processTablesForType(tableDef, tables) {
    const { tableSteps, postProcessSteps } = tableDef;
    const processedTables = tables.map((table) => runTableSteps(tableSteps, this, table));
    runPostProcessSteps(postProcessSteps, this, tables, processedTables);
  }

  processTables() {
    const { tables } = this.serverless.service.resources;
    delete this.serverless.service.resources.tables;

    const providerName = this.serverless.service.provider.name;

    let provider;
    const providerPath = `./${providerName}`;
    try {
      // eslint-disable-next-line no-dynamic-require, global-require, import/no-dynamic-require
      provider = require(providerPath);
    } catch (err) {
      if (err.message === `Cannot find module '${providerPath}'`) {
        throw new Error(`Provider ${providerName} is not supported by ${PACKAGE_NAME} at this time. Please open an issue.`);
      }

      throw err;
    }

    const tablesByType = separateByType(tables, provider.DEFAULT_TYPE);

    const tableTypes = Object.keys(tablesByType);
    tableTypes.forEach((tableType) => {
      const tableDef = provider[tableType];
      if (!tableDef) {
        throw new Error(`Unknown table type ${tableType} for provider ${providerName}. Please open an issue to request support if it wasn't a typo.`);
      }
      this.processTablesForType(tableDef, tablesByType[tableType]);
    });
  }
}

module.exports = TablesPlugin;
