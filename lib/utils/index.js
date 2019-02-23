
const separateByType = (tables, defaultType) => (
  Object.entries(tables).reduce((acc, [key, value]) => {
    const type = value.type || defaultType;
    let typeArray = acc[type];
    if (!Array.isArray(typeArray)) {
      typeArray = [];
      acc[type] = typeArray;
    }

    const tableDef = { name: key, ...value };
    typeArray.push(tableDef);
    return acc;
  }, {})
);

const dedupe = (array, propGetter) => {
  if (!array) {
    return array;
  }

  const getter = propGetter || ((item) => item);
  const seen = new Set();
  return array.reduce((acc, item) => {
    const value = getter(item);
    if (seen.has(value)) {
      return acc;
    }

    seen.add(value);
    acc.push(item);
    return acc;
  }, []);
};

const getPluginOptions = (plugin) => plugin.serverless.service.custom.tables || {};

module.exports = {
  separateByType,
  dedupe,
  getPluginOptions,
};
