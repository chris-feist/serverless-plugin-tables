const pascalCase = require('pascal-case');

const RESOURCE_NAME_TEMPLATE = '{tableName}DynamoDbTable';

const createResourceName = (table) => RESOURCE_NAME_TEMPLATE.replace('{tableName}', pascalCase(table.name));

module.exports = (plugin, table, template) => {
  const resourceName = table.resourceName || createResourceName(table);
  const resource = {
    [resourceName]: template,
  };

  plugin.debug('Created resource', JSON.stringify(resource));

  return resource;
};
