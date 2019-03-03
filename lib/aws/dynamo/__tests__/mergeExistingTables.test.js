const mergeExistingTables = require('../mergeExistingTables');

const { createTableResource } = require('../testUtils');

beforeEach(() => {
  jest.clearAllMocks();
});

const createPlugin = (existing) => ({
  debug: jest.fn(),
  service: {
    resources: !existing ? {} : {
      Resources: existing.reduce((res, e) => {
        Object.assign(res, e);
        return res;
      }, {}),
    },
  },

});

describe('mergeExistingTables', () => {
  test('merges existing tables', () => {
    const existing = [
      createTableResource({ resourceName: 'Existing1', tableName: 'Existing1' }),
      createTableResource({ resourceName: 'Existing2', tableName: 'Existing2' }),
      createTableResource({ resourceName: 'Existing3', tableName: 'Existing3' }),
    ];
    const plugin = createPlugin(existing);
    const tables = {}; // ignored
    const processedTables = [
      createTableResource({ resourceName: 'New1', tableName: 'New1' }),
      createTableResource({ resourceName: 'New2', tableName: 'New2' }),
      createTableResource({ resourceName: 'New3', tableName: 'New3' }),
    ];

    const result = mergeExistingTables(plugin, tables, processedTables);

    expect(result).toHaveLength(6);
    expect(result).toContainEqual(existing[0]);
    expect(result).toContainEqual(processedTables[0]);
  });

  test('no existing tables', () => {
    const plugin = createPlugin();
    const tables = {}; // ignored
    const processedTables = [
      createTableResource({ resourceName: 'New1', tableName: 'New1' }),
      createTableResource({ resourceName: 'New2', tableName: 'New2' }),
      createTableResource({ resourceName: 'New3', tableName: 'New3' }),
    ];

    const result = mergeExistingTables(plugin, tables, processedTables);

    expect(result).toHaveLength(3);
    expect(result).toContainEqual(processedTables[0]);
    expect(result).toContainEqual(processedTables[2]);
  });

  test('table resource name already exists', () => {
    const existing = [
      createTableResource({ resourceName: 'Existing1', tableName: 'Existing1' }),
    ];
    const plugin = createPlugin(existing);
    const tables = {}; // ignored
    const processedTables = [
      createTableResource({ resourceName: 'Existing1', tableName: 'New1' }),
    ];

    expect(() => mergeExistingTables(plugin, tables, processedTables)).toThrow();
  });

  test('table name already exists', () => {
    const existing = [
      createTableResource({ resourceName: 'Existing1', tableName: 'Existing1' }),
    ];
    const plugin = createPlugin(existing);
    const tables = {}; // ignored
    const processedTables = [
      createTableResource({ resourceName: 'New1', tableName: 'Existing1' }),
    ];

    expect(() => mergeExistingTables(plugin, tables, processedTables)).toThrow();
  });
});
