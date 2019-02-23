// tableSteps
const createProperties = require('./createProperties');
const createTemplate = require('./createTemplate');
const createResource = require('./createResource');

// postProcessSteps
const mergeExistingTables = require('./mergeExistingTables');
const handleDeploymentLimit = require('./handleDeploymentLimit');
const addToResources = require('./addToResources');

module.exports = {
  tableSteps: [
    createProperties,
    createTemplate,
    createResource,
  ],
  postProcessSteps: [
    mergeExistingTables,
    handleDeploymentLimit,
    addToResources,
  ],
};
