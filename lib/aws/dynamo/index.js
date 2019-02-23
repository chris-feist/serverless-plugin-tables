const createProperties = require('./createProperties');
const createTemplate = require('./createTemplate');
const createResource = require('./createResource');

module.exports = {
  tableSteps: [
    createProperties,
    createTemplate,
    createResource,
  ],
  postProcessSteps: [
  ],
};
