
module.exports = (plugin, tables, processedTables) => {
  if (!plugin.serverless.service.resources.Resources) {
    // eslint-disable-next-line no-param-reassign
    plugin.serverless.service.resources.Resources = {};
  }

  processedTables.forEach((table) => (
    Object.assign(plugin.serverless.service.resources.Resources, table)));
  return processedTables;
};
