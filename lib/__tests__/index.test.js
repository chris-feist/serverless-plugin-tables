const TablesPlugin = require('../index');
const aws = require('../aws');

jest.mock('../aws');

aws.dynamo = {
  tableSteps: [
    jest.fn(),
  ],
  postProcessSteps: [
    jest.fn(),
  ],
};

const createServerless = () => ({
  cli: {
    consoleLog: jest.fn(),
  },
  pluginManager: {
    spawn: jest.fn(),
  },
  service: {
    provider: {
      name: 'aws',
    },
  },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TablesPlugin', () => {
  test('initializes plugin', () => {
    const serverless = createServerless();
    const options = {};

    const result = new TablesPlugin(serverless, options);

    expect(result).toBeDefined();
    expect(result.serverless).toEqual(serverless);
    expect(result.options).toEqual(options);
    expect(result.service).toEqual(serverless.service);
    expect(result.commands).toMatchSnapshot();
    expect(result.hooks).toMatchSnapshot();
    expect(aws.checkPluginCompatibility).toHaveBeenCalled();
  });

  test('initializes option flags', () => {
    const serverless = createServerless();
    const options = {
      d: true,
      v: true,
    };

    const result = new TablesPlugin(serverless, options);

    expect(result).toBeDefined();
    expect(result.isDebug).toBe(true);
    expect(result.isVerbose).toBe(true);
  });

  test('initializes option names', () => {
    const serverless = createServerless();
    const options = {
      debug: true,
      verbose: true,
    };

    const result = new TablesPlugin(serverless, options);

    expect(result).toBeDefined();
    expect(result.isDebug).toBe(true);
    expect(result.isVerbose).toBe(true);
  });

  test('initialize with unsupported provider', () => {
    const serverless = createServerless();
    serverless.service.provider.name = 'google';
    const options = {};

    expect(() => new TablesPlugin(serverless, options)).toThrow();
  });

  test('log', () => {
    const serverless = createServerless();
    const options = {};
    const plugin = new TablesPlugin(serverless, options);

    plugin.log('test-message1', 'test-message2');

    expect(serverless.cli.consoleLog).toHaveBeenCalled();
    expect(serverless.cli.consoleLog.mock.calls[0][0]).toEqual(
      'serverless-plugin-tables: test-message1 test-message2',
    );
  });

  test('hook: process', () => {
    const serverless = createServerless();
    const options = {
      verbose: true,
    };
    const plugin = new TablesPlugin(serverless, options);

    plugin.hooks[`${TablesPlugin.PLUGIN_NAME}:process:process`]();

    expect(serverless.cli.consoleLog).toHaveBeenCalledWith(expect.stringMatching(/.*Processing tables\.\.\..*/));
  });

  test('hook: before:package:createDeploymentArtifacts', () => {
    const serverless = createServerless();
    const options = {};
    const plugin = new TablesPlugin(serverless, options);

    plugin.hooks['before:package:createDeploymentArtifacts']();

    expect(serverless.pluginManager.spawn).toHaveBeenCalledWith(
      `${TablesPlugin.PLUGIN_NAME}:process`,
    );
  });

  describe('verbose', () => {
    test('disabled', () => {
      const serverless = createServerless();
      const options = {};
      const plugin = new TablesPlugin(serverless, options);

      plugin.verbose('test-message1');

      expect(serverless.cli.consoleLog).not.toHaveBeenCalled();
    });

    test('enabled', () => {
      const serverless = createServerless();
      const options = {
        verbose: true,
      };
      const plugin = new TablesPlugin(serverless, options);

      plugin.verbose('test-message1');

      expect(serverless.cli.consoleLog).toHaveBeenCalled();
    });

    test('debug enabled', () => {
      const serverless = createServerless();
      const options = {
        debug: true,
      };
      const plugin = new TablesPlugin(serverless, options);

      plugin.verbose('test-message1');

      expect(serverless.cli.consoleLog).toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    test('disabled', () => {
      const serverless = createServerless();
      const options = {};
      const plugin = new TablesPlugin(serverless, options);

      plugin.debug('test-message1');

      expect(serverless.cli.consoleLog).not.toHaveBeenCalled();
    });

    test('enabled', () => {
      const serverless = createServerless();
      const options = {
        debug: true,
      };
      const plugin = new TablesPlugin(serverless, options);

      plugin.debug('test-message1');

      expect(serverless.cli.consoleLog).toHaveBeenCalled();
    });
  });

  test('spawn', () => {
    const serverless = createServerless();
    const options = {};
    const plugin = new TablesPlugin(serverless, options);

    plugin.spawn('test-command');

    expect(serverless.pluginManager.spawn).toHaveBeenCalledWith(
      `${TablesPlugin.PLUGIN_NAME}:test-command`,
    );
  });

  describe('getOptions', () => {
    test('no custom variables', () => {
      const serverless = createServerless();
      const options = {};
      const plugin = new TablesPlugin(serverless, options);

      const result = plugin.getOptions();

      expect(result).toEqual({});
    });

    test('gets options', () => {
      const expected = {
        opt1: 'test1',
        opt2: 'test2',
      };
      const serverless = createServerless();
      serverless.service.custom = {
        tables: expected,
      };
      const options = {};
      const plugin = new TablesPlugin(serverless, options);

      const result = plugin.getOptions();

      expect(result).toEqual(expected);
    });
  });

  test('gets provider definition', () => {
    const serverless = createServerless();
    const options = {};
    const plugin = new TablesPlugin(serverless, options);

    const result = plugin.getProviderDefinition();

    expect(result).toBe(aws);
  });

  test('runTableSteps', () => {
    const serverless = createServerless();
    const options = {};
    const plugin = new TablesPlugin(serverless, options);
    const tableSteps = [
      jest.fn(() => 'step1-complete'),
      jest.fn(() => 'step2-complete'),
      jest.fn(() => 'step3-complete'),
    ];
    const table = { name: 'TestTable' };

    const result = plugin.runTableSteps(tableSteps, table);

    expect(result).toEqual('step3-complete');
    expect(tableSteps[0]).toHaveBeenCalledWith(plugin, table, null);
    expect(tableSteps[1]).toHaveBeenCalledWith(plugin, table, 'step1-complete');
    expect(tableSteps[2]).toHaveBeenCalledWith(plugin, table, 'step2-complete');
  });

  test('runPostProcessSteps', () => {
    const serverless = createServerless();
    const options = {};
    const plugin = new TablesPlugin(serverless, options);
    const postProcessSteps = [
      jest.fn(() => 'step1-complete'),
      jest.fn(() => 'step2-complete'),
      jest.fn(() => 'step3-complete'),
    ];
    const tables = [{ name: 'TestTable' }];
    const processedTables = [{ name: 'ProcessedTestTable' }];

    const result = plugin.runPostProcessSteps(postProcessSteps, tables, processedTables);

    expect(result).toEqual('step3-complete');
    expect(postProcessSteps[0]).toHaveBeenCalledWith(plugin, tables, processedTables);
    expect(postProcessSteps[1]).toHaveBeenCalledWith(plugin, tables, 'step1-complete');
    expect(postProcessSteps[2]).toHaveBeenCalledWith(plugin, tables, 'step2-complete');
  });

  describe('process', () => {
    test('no resources defined', () => {
      const serverless = createServerless();
      const options = {
        verbose: true,
      };
      const plugin = new TablesPlugin(serverless, options);

      plugin.process();

      expect(serverless.cli.consoleLog).toHaveBeenCalledWith(expect.stringMatching(/.*No tables to process.*/));
    });

    test('no tables defined', () => {
      const serverless = createServerless();
      Object.assign(serverless.service, {
        resources: {
          tables: null,
        },
      });
      const options = {
        verbose: true,
      };
      const plugin = new TablesPlugin(serverless, options);

      plugin.process();

      expect(serverless.cli.consoleLog).toHaveBeenCalledWith(expect.stringMatching(/.*No tables to process.*/));
    });

    test('processes tables', () => {
      const serverless = createServerless();
      Object.assign(serverless.service, {
        resources: {
          tables: {
            Table1: {
              type: 'dynamo',
            },
            Table2: {
              type: 'dynamo',
            },
          },
        },
      });
      const options = { };
      const plugin = new TablesPlugin(serverless, options);

      plugin.process();

      expect(aws.dynamo.tableSteps[0]).toHaveBeenCalledTimes(2);
      expect(aws.dynamo.postProcessSteps[0]).toHaveBeenCalledTimes(1);
    });

    test('unknown table type', () => {
      const serverless = createServerless();
      Object.assign(serverless.service, {
        resources: {
          tables: {
            Table1: {
              type: 'dynamo',
            },
            UnknownTable: {
              type: 'sql',
            },
          },
        },
      });
      const options = { debug: true };
      const plugin = new TablesPlugin(serverless, options);

      expect(() => plugin.process()).toThrow();
    });
  });
});
