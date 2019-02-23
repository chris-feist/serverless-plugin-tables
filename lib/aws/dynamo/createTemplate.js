const merge = require('merge-deep');

const CLOUD_FORMATION_TYPE = 'AWS::DynamoDB::Table';

module.exports = (plugin, table, properties) => {
  const computedTemplate = {
    Type: CLOUD_FORMATION_TYPE,
    Properties: properties,
  };
  const customTemplate = table.template;
  return merge(computedTemplate, customTemplate);
};
