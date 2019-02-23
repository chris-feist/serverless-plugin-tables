
module.exports = (plugin, tables, processedTables) => {
  processedTables.forEach((table) => (
    Object.assign(plugin.serverless.service.resources.Resources, table)));
  return processedTables;
};
