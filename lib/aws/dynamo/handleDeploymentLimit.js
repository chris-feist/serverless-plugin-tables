const { dedupe, getPluginOptions } = require('../../utils');

// Dynamo has a limit on the number of tables that can be
// deployed at a time. This step helps get around that.
// https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Limits.html#limits-api
const MAX_TABLE_BATCH = 10;

const checkDependency = (dependsOn, remainingTableResources) => {
  for (let index = 0; index < dependsOn.length; index += 1) {
    const dependency = dependsOn[index];
    if (remainingTableResources.includes(dependency)) {
      return true;
    }
  }

  return false;
};

const createBatch = (remainingTables, batchSize, batchDependency) => {
  const remainingTableResources = remainingTables.map((table) => Object.keys(table)[0]);
  const batch = [];
  let index = 0;
  while (batch.length < batchSize && index < remainingTables.length) {
    const table = remainingTables[index];
    const tableTemplate = Object.values(table)[0];
    const dependsOn = tableTemplate.DependsOn || [];
    const dependsOnList = Array.isArray(dependsOn) ? dependsOn : [dependsOn];
    if (checkDependency(dependsOnList, remainingTableResources.slice(index))) {
      index += 1;
      continue;
    }

    if (batchDependency) {
      dependsOnList.push(batchDependency);
      tableTemplate.DependsOn = dedupe(dependsOnList);
    }

    batch.push(table);
    remainingTables.splice(index, 1);
  }

  return batch;
};

module.exports = (plugin, tables, incomingTables) => {
  const { dynamo = {} } = getPluginOptions(plugin);
  const batchSize = dynamo.deploymentBatchSize || MAX_TABLE_BATCH;

  const processedTables = [];
  while (incomingTables.length > 0) {
    const lastProcessedTable = processedTables[processedTables.length - 1];
    const lastResource = lastProcessedTable ? Object.keys(lastProcessedTable)[0] : null;
    const batch = createBatch(incomingTables, batchSize, lastResource);
    if (batch.length === 0) {
      throw new Error('Circular table dependency found. Crosscheck existing resources with \'tables\'');
    }

    plugin.debug('Created deployment batch', JSON.stringify(batch));

    processedTables.push(...batch);
  }

  return processedTables;
};
