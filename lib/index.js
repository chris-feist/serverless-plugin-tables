
const { separateByType } = require('./utils');

const PLUGIN_NAME = 'tables';
const PACKAGE_NAME = `serverless-plugin-${PLUGIN_NAME}`;


class TablesPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.isDebug = options.debug || options.d;

    this.provider = this.serverless.getProvider('aws');

    this.hooks = {
      'before:package:createDeploymentArtifacts': () => this.processTables(),
    };
  }

  log(...args) {
    const message = args.join(' ');
    this.serverless.cli.consoleLog(`${PACKAGE_NAME}: ${message}`);
  }

  debug(...args) {
    if (!this.isDebug) {
      return;
    }

    this.log(...args);
  }

  runTableSteps(tableSteps = [], table) {
    this.debug('Running table steps for', table.name);
    return tableSteps.reduce(
      (input, step, index) => {
        this.debug('Running table step', index);
        return step(this, table, input);
      },
      null,
    );
  }

  runPostProcessSteps(postProcessSteps = [], tables, processedTables) {
    return postProcessSteps.reduce(
      (input, step, index) => {
        this.debug('Running post process step', index);
        return step(this, tables, input);
      },
      processedTables,
    );
  }

  processTablesForType(tableDef, tables) {
    const { tableSteps, postProcessSteps } = tableDef;
    const processedTables = tables.map((table) => this.runTableSteps(tableSteps, table));
    this.runPostProcessSteps(postProcessSteps, tables, processedTables);
  }

  processTables() {
    try {
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
        this.debug('Processing table type', tableType);
        const tableDef = provider[tableType];
        if (!tableDef) {
          throw new Error(`Unknown table type ${tableType} for provider ${providerName}. Please open an issue to request support if it wasn't a typo.`);
        }
        this.processTablesForType(tableDef, tablesByType[tableType]);
      });
      this.debug('Done processing all tables');
    } catch (err) {
      if (this.isDebug) {
        // Use console to log out stack trace
        console.error('ERROR', err); // eslint-disable-line no-console
      }
      throw err;
    }
  }
}

module.exports = TablesPlugin;
