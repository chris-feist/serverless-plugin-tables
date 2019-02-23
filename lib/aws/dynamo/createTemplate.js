const merge = require('merge-deep');

const { CLOUD_FORMATION_TYPE } = require('./constants');

module.exports = (plugin, table, properties) => {
  const computedTemplate = {
    Type: CLOUD_FORMATION_TYPE,
    Properties: properties,
  };
  const customTemplate = table.template;
  const merged = merge(computedTemplate, customTemplate);

  plugin.debug('Created template', JSON.stringify(merged));

  return merged;
};
