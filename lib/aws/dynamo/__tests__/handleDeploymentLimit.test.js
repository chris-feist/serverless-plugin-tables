
const handleDeploymentLimit = require('../handleDeploymentLimit');

const { createTableResource } = require('../testUtils');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('handleDeploymentLimit', () => {
  describe('checkDependency', () => {
    test('finds dependency', () => {
      const dependsOn = ['dep1', 'dep2', 'dep3', 'dep4'];
      const remainingTableResources = new Set(['depA', 'depB', 'dep3', 'depD']);

      const result = handleDeploymentLimit.checkDependency(dependsOn, remainingTableResources);

      expect(result).toEqual(true);
    });

    test('no matching dependencies', () => {
      const dependsOn = ['dep1', 'dep2', 'dep3', 'dep4'];
      const remainingTableResources = new Set(['depA', 'depB', 'depC', 'depD']);

      const result = handleDeploymentLimit.checkDependency(dependsOn, remainingTableResources);

      expect(result).toEqual(false);
    });
  });

  describe('createBatch', () => {
    test('creates a batch with internal dependencies', () => {
      const remainingTables = [
        createTableResource({ resourceName: 'res1', dependsOn: 'res9' }),
        createTableResource({ resourceName: 'res2', dependsOn: 'res1000' }),
        createTableResource({ resourceName: 'res3' }),
        createTableResource({ resourceName: 'res4' }),
        createTableResource({ resourceName: 'res5' }),
        createTableResource({ resourceName: 'res6' }),
        createTableResource({ resourceName: 'res7' }),
        createTableResource({ resourceName: 'res8' }),
        createTableResource({ resourceName: 'res9' }),
        createTableResource({ resourceName: 'res10', dependsOn: 'res9' }),
        createTableResource({ resourceName: 'res11', dependsOn: 'res10' }),
        createTableResource({ resourceName: 'res12', dependsOn: 'res11' }),
      ];
      const batchSize = 5;

      const result = handleDeploymentLimit.createBatch(remainingTables, batchSize);

      expect(result).toMatchSnapshot();
      expect(remainingTables).toMatchSnapshot();
    });

    test('creates a batch assigns depends on', () => {
      const remainingTables = [
        createTableResource({ resourceName: 'res1', dependsOn: 'res4' }),
        createTableResource({ resourceName: 'res2', dependsOn: 'res5' }),
        createTableResource({ resourceName: 'res3' }),
        createTableResource({ resourceName: 'res4' }),
        createTableResource({ resourceName: 'res5', dependsOn: 'res999' }),
      ];
      const batchSize = 5;
      const dependsOn = 'otherRes';

      const result = handleDeploymentLimit.createBatch(remainingTables, batchSize, dependsOn);

      expect(Object.values(result[0])[0].DependsOn[0]).toEqual(dependsOn);
      expect(result).toMatchSnapshot();
      expect(remainingTables).toMatchSnapshot();
    });
  });

  test('batches tables', () => {
    const plugin = {
      debug: jest.fn(),
      getOptions: jest.fn(() => ({})),
    };
    const tables = []; // ignored
    const incomingTables = [
      createTableResource({ resourceName: 'res1', dependsOn: 'res9' }),
      createTableResource({ resourceName: 'res2', dependsOn: 'res1' }),
      createTableResource({ resourceName: 'res3' }),
      createTableResource({ resourceName: 'res4' }),
      createTableResource({ resourceName: 'res5' }),
      createTableResource({ resourceName: 'res6' }),
      createTableResource({ resourceName: 'res7' }),
      createTableResource({ resourceName: 'res8' }),
      createTableResource({ resourceName: 'res9' }),
      createTableResource({ resourceName: 'res10', dependsOn: 'res9' }),
      createTableResource({ resourceName: 'res11', dependsOn: 'res10' }),
      createTableResource({ resourceName: 'res12', dependsOn: 'res11' }),
    ];

    const result = handleDeploymentLimit(plugin, tables, incomingTables);

    expect(result).toMatchSnapshot();
  });

  test('circular dependency', () => {
    const plugin = {
      debug: jest.fn(),
      getOptions: jest.fn(() => ({})),
    };
    const tables = []; // ignored
    const incomingTables = [
      createTableResource({ resourceName: 'res1', dependsOn: 'res3' }),
      createTableResource({ resourceName: 'res2', dependsOn: 'res1' }),
      createTableResource({ resourceName: 'res3', dependsOn: 'res2' }),
    ];

    expect(() => handleDeploymentLimit(plugin, tables, incomingTables)).toThrow();
  });
});
