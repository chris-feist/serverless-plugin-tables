const createTemplate = require('../createTemplate');

const { createTableResource } = require('../testUtils');

const createProperties = () => createTableResource().TestResource.Properties;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createTemplate', () => {
  test('creates template', () => {
    const plugin = {
      debug: jest.fn(),
    };
    const table = {
    };
    const properties = createProperties();

    const result = createTemplate(plugin, table, properties);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('Type', 'AWS::DynamoDB::Table');
    expect(result).toHaveProperty('Properties', properties);
  });

  test('merges custom template', () => {
    const plugin = {
      debug: jest.fn(),
    };
    const table = {
      template: {
        Properties: {
          Prop1: 'prop-1',
          Prop2: 'prop-2',
        },
        DependsOn: 'dependency',
      },
    };
    const properties = {
      TableName: 'TestTable',
      Prop1: 'old-prop',
    };

    const result = createTemplate(plugin, table, properties);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('Type', 'AWS::DynamoDB::Table');
    expect(result).toHaveProperty('Properties', {
      TableName: 'TestTable',
      Prop1: 'prop-1',
      Prop2: 'prop-2',
    });
    expect(result).toHaveProperty('DependsOn', 'dependency');
  });
});
