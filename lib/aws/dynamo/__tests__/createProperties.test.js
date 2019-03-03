const createProperties = require('../createProperties');

const createPlugin = () => ({
  debug: jest.fn(),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createProperties', () => {
  test('creates required properties', () => {
    const plugin = createPlugin();
    const table = {
      name: 'TestTable',
      partitionKey: 'id',
    };

    const result = createProperties(plugin, table);

    expect(result).toEqual({
      TableName: table.name,
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
      ],
    });
  });

  test('different key data type', () => {
    const plugin = createPlugin();
    const table = {
      name: 'TestTable',
      partitionKey: {
        name: 'id',
        type: 'number',
      },
      sortKey: {
        name: 'deleted',
        type: 'boolean',
      },
    };

    const result = createProperties(plugin, table);

    expect(result).toEqual({
      TableName: table.name,
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
        { AttributeName: 'deleted', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'N' },
        { AttributeName: 'deleted', AttributeType: 'BOOL' },
      ],
    });
  });

  test('provisioned units', () => {
    const plugin = createPlugin();
    const table = {
      name: 'TestTable',
      partitionKey: 'id',
      writeUnits: 1,
      readUnits: 5,
    };

    const result = createProperties(plugin, table);

    expect(result.BillingMode).toEqual('PROVISIONED');
    expect(result.ProvisionedThroughput).toEqual({
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 1,
    });
  });

  test('tags units', () => {
    const plugin = createPlugin();
    const table = {
      name: 'TestTable',
      partitionKey: 'id',
      tags: {
        key1: 'value1',
        key2: 'value2',
      },
    };

    const result = createProperties(plugin, table);

    expect(result.Tags).toHaveLength(2);
    expect(result.Tags).toContainEqual({
      Key: 'key1',
      Value: 'value1',
    });
    expect(result.Tags).toContainEqual({
      Key: 'key2',
      Value: 'value2',
    });
  });


  test('streams', () => {
    const plugin = createPlugin();
    const table = {
      name: 'TestTable',
      partitionKey: 'id',
      streamType: 'newItem',
    };

    const result = createProperties(plugin, table);

    expect(result.StreamSpecification).toEqual({
      StreamViewType: 'NEW_IMAGE',
    });
  });

  test('TTL key', () => {
    const plugin = createPlugin();
    const table = {
      name: 'TestTable',
      partitionKey: 'id',
      ttlKey: 'expireTime',
    };

    const result = createProperties(plugin, table);

    expect(result.TimeToLiveSpecification).toEqual({
      AttributeName: 'expireTime',
      Enabled: true,
    });
  });

  test('Encrypted', () => {
    const plugin = createPlugin();
    const table = {
      name: 'TestTable',
      partitionKey: 'id',
      encrypted: true,
    };

    const result = createProperties(plugin, table);

    expect(result.SSESpecification).toEqual({
      SSEEnabled: true,
    });
  });

  test('Point in type recovery', () => {
    const plugin = createPlugin();
    const table = {
      name: 'TestTable',
      partitionKey: 'id',
      pointInTimeRecovery: true,
    };

    const result = createProperties(plugin, table);

    expect(result.PointInTimeRecoverySpecification).toEqual({
      PointInTimeRecoveryEnabled: true,
    });
  });

  test('Global Secondary Indexes', () => {
    const plugin = createPlugin();
    const table = {
      name: 'TestTable',
      partitionKey: 'id',
      indexes: [
        {
          name: 'OnlyPartitionGsi',
          partitionKey: 'only-partition',
        },
        {
          name: 'OnlyKeysGsi',
          partitionKey: 'both-partition',
          sortKey: 'both-sort',
        },
        {
          name: 'ComplexKeysGsi',
          partitionKey: {
            name: 'complex-partition',
            type: 'number',
          },
          sortKey: {
            name: 'complex-sort',
            type: 'boolean',
          },
        },
        {
          name: 'ProvisionedGsi',
          partitionKey: 'provisioned-partition',
          writeUnits: 1,
          readUnits: 5,
        },
        {
          name: 'KeysProjectedGsi',
          partitionKey: 'projects-keys-partition',
          projection: 'keys',
        },
        {
          name: 'IncludesProjectionGsi',
          partitionKey: 'projects-includes-partition',
          projection: [
            'field1',
            'field2',
          ],
        },
      ],
    };

    const result = createProperties(plugin, table);

    expect(result.AttributeDefinitions).toEqual([
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'only-partition', AttributeType: 'S' },
      { AttributeName: 'both-partition', AttributeType: 'S' },
      { AttributeName: 'both-sort', AttributeType: 'S' },
      { AttributeName: 'complex-partition', AttributeType: 'N' },
      { AttributeName: 'complex-sort', AttributeType: 'BOOL' },
      { AttributeName: 'provisioned-partition', AttributeType: 'S' },
      { AttributeName: 'projects-keys-partition', AttributeType: 'S' },
      { AttributeName: 'projects-includes-partition', AttributeType: 'S' },
    ]);
    expect(result.GlobalSecondaryIndexes).toMatchSnapshot();
    expect(result.LocalSecondaryIndexes).not.toBeDefined();
  });

  test('Local Secondary Indexes', () => {
    const plugin = createPlugin();
    const table = {
      name: 'TestTable',
      partitionKey: 'id',
      indexes: [
        {
          name: 'OnlyKeysLsi',
          sortKey: 'only-sort',
        },
        {
          name: 'ComplexKeysLsi',
          sortKey: {
            name: 'complex-sort',
            type: 'number',
          },
        },
        {
          name: 'ProvisionedLsi',
          sortKey: 'provisioned-sort',
          writeUnits: 1,
          readUnits: 5,
        },
        {
          name: 'KeysProjectedLsi',
          sortKey: 'projects-keys-sort',
          projection: 'keys',
        },
        {
          name: 'IncludesProjectionLsi',
          sortKey: 'projects-includes-sort',
          projection: [
            'field1',
            'field2',
          ],
        },
      ],
    };

    const result = createProperties(plugin, table);

    expect(result.AttributeDefinitions).toEqual([
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'only-sort', AttributeType: 'S' },
      { AttributeName: 'complex-sort', AttributeType: 'N' },
      { AttributeName: 'provisioned-sort', AttributeType: 'S' },
      { AttributeName: 'projects-keys-sort', AttributeType: 'S' },
      { AttributeName: 'projects-includes-sort', AttributeType: 'S' },
    ]);
    expect(result.LocalSecondaryIndexes).toMatchSnapshot();
    expect(result.GlobalSecondaryIndexes).not.toBeDefined();
  });
});
