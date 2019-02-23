
const { CLOUD_FORMATION_TYPE } = require('./constants');

const findExisting = (resources = {}) => (
  Object.entries(resources)
    .filter(([, template]) => template.Type === CLOUD_FORMATION_TYPE)
    .map(([name, template]) => ({
      [name]: template,
    }))
);

const getTableName = (table) => Object.values(table)[0].Properties.TableName;

const getResourceName = (table) => Object.keys(table)[0];

const checkDuplicateValues = (tables, getter, name) => {
  const seen = new Set();
  tables.forEach((table) => {
    const value = getter(table);
    if (seen.has(value)) {
      throw new Error(`Duplicate ${name} found: ${value}. Crosscheck existing resources with 'tables'`);
    }
    seen.add(value);
  });
};

const checkDuplicates = (tables) => {
  checkDuplicateValues(tables, getResourceName, 'Resource Name');
  checkDuplicateValues(tables, getTableName, 'Table Name');
};

module.exports = (plugin, tables, processedTables) => {
  const existing = findExisting(plugin.serverless.service.resources.Resources);

  plugin.debug('Found existing tables', JSON.stringify(existing));
  const allTables = existing.concat(processedTables);

  checkDuplicates(allTables);

  return allTables;
};
