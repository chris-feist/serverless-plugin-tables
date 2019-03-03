const addToResources = require('../addToResources');

const { createTableResource } = require('../testUtils');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('addToResources', () => {
  test('adds to resources', () => {
    const plugin = {
      service: {
        resources: {},
      },
    };
    const tables = []; // ignored
    const processedTables = [
      createTableResource({ resourceName: 'Res1', tableName: 'Table1' }),
      createTableResource({ resourceName: 'Res2', tableName: 'Table2' }),
      createTableResource({ resourceName: 'Res3', tableName: 'Table3' }),
      createTableResource({ resourceName: 'Res4', tableName: 'Table4' }),
    ];

    addToResources(plugin, tables, processedTables);

    expect(plugin.service.resources.Resources).toBeDefined();
    expect(plugin.service.resources.Resources.Res1).toBeDefined();
    expect(plugin.service.resources).toMatchSnapshot();
  });


  test('initializes resources', () => {
    const plugin = {
      service: {
        resources: {},
      },
    };
    const tables = []; // ignored
    const processedTables = [createTableResource()];

    addToResources(plugin, tables, processedTables);

    expect(plugin.service.resources.Resources).toBeDefined();
    expect(plugin.service.resources).toMatchSnapshot();
  });
});
