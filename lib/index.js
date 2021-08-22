
const { separateByType } = require('./utils');

const PLUGIN_NAME = 'tables';
const PACKAGE_NAME = `serverless-plugin-${PLUGIN_NAME}`;

class TablesPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.service = serverless.service;
    this.isVerbose = options.verbose || options.v;
    this.isDebug = options.debug || options.d;

    this.commands = {
      [PLUGIN_NAME]: {
        usage: 'Easily manage table resources',
        lifecycleEvents: [
          PLUGIN_NAME,
        ],
        options: {
          verbose: {
            usage: 'Verbose output',
            shortcut: 'v',
            type: 'boolean',
          },
          debug: {
            usage: 'Debug the plugin',
            shortcut: 'd',
            type: 'boolean',
          },
        },
        commands: {
          process: {
            usage: 'Process table definitions',
            lifecycleEvents: [
              'process',
            ],
          },
        },
      },
    };

    this.hooks = {
      [`${PLUGIN_NAME}:process:process`]: () => this.process(),
      'before:package:createDeploymentArtifacts': () => this.spawn('process'),
    };

    this.checkPluginCompatibility();
  }

  log(...args) {
    const message = args.join(' ');
    this.serverless.cli.consoleLog(`${PACKAGE_NAME}: ${message}`);
  }

  verbose(...args) {
    if (!this.isVerbose && !this.isDebug) {
      return;
    }

    this.log(...args);
  }

  debug(...args) {
    if (!this.isDebug) {
      return;
    }

    this.log(...args);
  }

  spawn(command) {
    return this.serverless.pluginManager.spawn(`${PLUGIN_NAME}:${command}`);
  }

  getOptions() {
    const { custom = {} } = this.service;
    const { tables: options = {} } = custom;
    return options;
  }

  getProviderDefinition() {
    const providerName = this.service.provider.name;
    const providerPath = `./${providerName}`;
    try {
      // eslint-disable-next-line no-dynamic-require, global-require, import/no-dynamic-require
      return require(providerPath);
    } catch (err) {
      if (err.message.startsWith(`Cannot find module '${providerPath}'`)) {
        throw new Error(`Provider ${providerName} is not supported by ${PACKAGE_NAME} at this time. Please open an issue.`);
      }

      /* istanbul ignore next */
      throw err;
    }
  }

  checkPluginCompatibility() {
    const { checkPluginCompatibility: checkCompatibility } = this.getProviderDefinition();
    if (checkCompatibility) {
      checkCompatibility(this);
    }
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
    return this.runPostProcessSteps(postProcessSteps, tables, processedTables);
  }

  process() {
    try {
      this.verbose('Processing tables...');
      if (!this.service.resources) {
        this.verbose('No tables to process');
        return;
      }

      const { tables } = this.service.resources;
      delete this.service.resources.tables;
      if (!tables) {
        this.verbose('No tables to process');
        return;
      }

      const providerName = this.serverless.service.provider.name;

      const provider = this.getProviderDefinition();

      const tablesByType = separateByType(tables, provider.DEFAULT_TYPE);

      const tableTypes = Object.keys(tablesByType);
      const processed = tableTypes.reduce((acc, tableType) => {
        this.debug('Processing table type', tableType);
        const tableDef = provider[tableType];
        if (!tableDef) {
          throw new Error(`Unknown table type ${tableType} for provider ${providerName}. Please open an issue to request support if it wasn't a typo.`);
        }

        acc[tableType] = this.processTablesForType(tableDef, tablesByType[tableType]);
        return acc;
      }, {});
      this.verbose('Done processing all tables');
      this.verbose('Processed tables:\n', JSON.stringify(processed, null, 2));
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
Object.assign(module.exports, {
  PLUGIN_NAME,
  PACKAGE_NAME,
});
