
module.exports = (plugin, tables, processedTables) => {
  if (!plugin.service.resources.Resources) {
    // eslint-disable-next-line no-param-reassign
    plugin.service.resources.Resources = {};
  }

  processedTables.forEach((table) => (
    Object.assign(plugin.service.resources.Resources, table)));
  return processedTables;
};
