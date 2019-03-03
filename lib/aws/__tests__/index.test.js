const { checkPluginCompatibility } = require('../index');
const { PACKAGE_NAME } = require('../../index');

const createPlugin = (plugins = [PACKAGE_NAME]) => ({
  debug: jest.fn(),
  log: jest.fn(),
  spawn: jest.fn(),
  service: {
    plugins,
  },
  hooks: {
    'before:package:createDeploymentArtifacts': jest.fn(),
  },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('aws index', () => {
  describe('checkPluginCompatibility', () => {
    test('no other plugins', () => {
      const plugin = createPlugin();

      checkPluginCompatibility(plugin);

      expect(plugin.log).not.toHaveBeenCalled();
      expect(Object.keys(plugin.hooks)).toHaveLength(1);
      expect(plugin.hooks).toHaveProperty('before:package:createDeploymentArtifacts');
    });

    test('serverless-dynamodb-local before self', () => {
      const plugin = createPlugin([
        'serverless-dynamodb-local',
        PACKAGE_NAME,
      ]);

      checkPluginCompatibility(plugin);

      expect(plugin.log).toHaveBeenCalled();
      expect(Object.keys(plugin.hooks)).toHaveLength(4);
      expect(plugin.hooks).toHaveProperty('before:package:createDeploymentArtifacts');
      expect(plugin.hooks).toHaveProperty('before:dynamodb:migrate:migrateHandler');
      expect(plugin.hooks).toHaveProperty('before:dynamodb:start:startHandler');
      expect(plugin.hooks).toHaveProperty('before:offline:start:init');
    });

    test('serverless-dynamodb-local after self', () => {
      const plugin = createPlugin([
        PACKAGE_NAME,
        'serverless-dynamodb-local',
      ]);

      checkPluginCompatibility(plugin);

      expect(plugin.log).not.toHaveBeenCalled();
      expect(Object.keys(plugin.hooks)).toHaveLength(4);
      expect(plugin.hooks).toHaveProperty('before:package:createDeploymentArtifacts');
      expect(plugin.hooks).toHaveProperty('before:dynamodb:migrate:migrateHandler');
      expect(plugin.hooks).toHaveProperty('before:dynamodb:start:startHandler');
      expect(plugin.hooks).toHaveProperty('before:offline:start:init');
    });

    test('serverless-dynamodb-local hooks spawn process', () => {
      const plugin = createPlugin([
        PACKAGE_NAME,
        'serverless-dynamodb-local',
      ]);

      checkPluginCompatibility(plugin);

      plugin.hooks['before:dynamodb:migrate:migrateHandler']();
      plugin.hooks['before:dynamodb:start:startHandler']();
      plugin.hooks['before:offline:start:init']();

      expect(plugin.spawn).toHaveBeenCalledTimes(3);
      expect(plugin.spawn.mock.calls).toMatchSnapshot();
    });
  });
});
