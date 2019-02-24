const Plugin = require('../../..');

const dynamo = require('..');

beforeEach(() => {
  jest.clearAllMocks();
});

const dynamoService = {
  provider: {
    name: 'aws',
  },

  custom: {
    tables: {
      dynamo: {
        deploymentBatchSize: 2,
      },
    },
  },

  resources: {
    tables: {
      Music: {
        partitionKey: 'Artist',
        sortKey: 'SongTitle',
        indexes: [
          {
            name: 'GenreByTitleIndex',
            partitionKey: 'Genre',
            sortKey: 'AlbumTitle',
          },
        ],
      },
      People: {
        resourceName: 'FavoritePeopleDynamoTable',
        partitionKey: 'personID',
        sortKey: 'state',
        readUnits: 5,
        writeUnits: 5,
        indexes: [
          {
            name: 'EmailIndex',
            partitionKey: 'email',
            readUnits: 2,
            writeUnits: 2,
            projection: 'all',
          },
          {
            name: 'PersonByCreatedTimeIndex',
            sortKey: {
              name: 'createdTime',
              type: 'number',
            },
            readUnits: 2,
            writeUnits: 2,
            projection: 'keys',
          },
          {
            name: 'PersonByAgeIndex',
            sortKey: {
              name: 'age',
              type: 'number',
            },
            readUnits: 2,
            writeUnits: 2,
            projection: [
              'dob',
              'firstName',
              'lastName',
            ],
          },
        ],
        streamType: 'newItem',
        ttlKey: 'expirationTime',
        encrypted: true,
        pointInTimeRecovery: true,
        tags: {
          STAGE: 'test',
          TEAM: 'backend',
        },
        template: {
          Properties: {
            ProvisionedThroughput: {
              ReadCapacityUnits: 1,
            },
          },
        },
      },
    },
    Resources: {
      ExistingDynamoDBTable: {
        Type: 'AWS::DynamoDB::Table',
        DependsOn: 'FavoritePeopleDynamoTable',
        Properties: {
          TableName: 'ExistingTable',
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            {
              AttributeName: 'userID',
              AttributeType: 'S',
            },
            {
              AttributeName: 'email',
              AttributeType: 'S',
            },
            {
              AttributeName: 'createdTime',
              AttributeType: 'N',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'userID',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'email',
              KeyType: 'RANGE',
            },
          ],
          LocalSecondaryIndexes: [
            {
              IndexName: 'UsersTableEmailGSI',
              KeySchema: [
                {
                  AttributeName: 'userID',
                  KeyType: 'HASH',
                },
                {
                  AttributeName: 'createdTime',
                  KeyType: 'RANGE',
                },
              ],
              Projection: {
                ProjectionType: 'ALL',
              },
            },
          ],
        },
      },
    },
  },
};

describe('dynamo', () => {
  test('default export', () => {
    expect(dynamo).toBeDefined();
    expect(dynamo).toMatchSnapshot();
  });

  test('end to end', () => {
    const mockServerless = {
      getProvider: jest.fn(),
      service: dynamoService,
    };
    const mockOptions = {};

    const instance = new Plugin(mockServerless, mockOptions);

    instance.processTables();

    expect(mockServerless.service.resources).toMatchSnapshot();
  });
});
