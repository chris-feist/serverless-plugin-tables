const createResource = require('../createResource');

const { createTableResource } = require('../testUtils');

const createTemplate = () => createTableResource().TestResource;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createResource', () => {
  test('creates default resource name', () => {
    const plugin = {
      debug: jest.fn(),
    };
    const table = {
      name: 'testTable',
    };
    const template = createTemplate();

    const result = createResource(plugin, table, template);

    expect(result).toHaveProperty('TestTableDynamoDbTable', template);
  });

  test('creates custom resource name', () => {
    const plugin = {
      debug: jest.fn(),
    };
    const table = {
      resourceName: 'CustomResource',
      name: 'testTable',
    };
    const template = createTemplate();

    const result = createResource(plugin, table, template);

    expect(result).toHaveProperty('CustomResource', template);
  });
});
