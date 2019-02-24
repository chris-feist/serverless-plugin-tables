if (process.env.NODE_ENV !== 'test') {
  throw new Error('Invalid use of test utils');
}

const { CLOUD_FORMATION_TYPE } = require('./constants');

const createTableResource = ({
  resourceName = 'TestResource',
  dependsOn,
  tableName = 'TestTable',
}) => ({
  [resourceName]: {
    Type: CLOUD_FORMATION_TYPE,
    ...(!dependsOn ? {} : { DependsOn: dependsOn }),
    Properties: {
      TableName: tableName,
    },
  },
});

module.exports = {
  createTableResource,
};
