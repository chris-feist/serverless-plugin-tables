
const mapper = require('object-mapper');
const merge = require('merge-deep');
const { dedupe } = require('../../utils');

const DEFAULT_DATA_TYPE = 'string';
const DATA_TYPE_MAP = {
  string: 'S',
  number: 'N',
  binary: 'B',
  boolean: 'BOOL',
  list: 'L',
  map: 'M',
  numberSet: 'NS',
  stringSet: 'SS',
  binarySet: 'BS',
  null: 'NULL',
};

const STREAM_TYPE_MAP = {
  newItem: 'NEW_IMAGE',
  oldItem: 'OLD_IMAGE',
  both: 'NEW_AND_OLD_IMAGES',
  keys: 'KEYS_ONLY',
};

const DEFAULT_PROJECTION = 'all';
const PROJECTION_TYPE_MAP = {
  all: 'ALL',
  keys: 'KEYS_ONLY',
  include: 'INCLUDE',
};

const DEFAULT_PROPERTIES = {
  BillingMode: 'PAY_PER_REQUEST',
};

const KEY_TYPES = {
  partitionKey: 'HASH',
  sortKey: 'RANGE',
};

const keyMapping = {
  name: 'AttributeName',
  keyType: 'KeyType',
};

// eslint-disable-next-line no-unused-vars
const createKeyTransform = (attrDst) => (srcValue, srcObject, dstObject, srcKey, dstKey) => {
  if (!(srcKey in srcObject)) {
    return undefined;
  }

  let keyDef;
  if (typeof srcValue === 'string') {
    keyDef = {
      name: srcValue,
      type: DEFAULT_DATA_TYPE,
    };
  } else {
    keyDef = srcValue;
  }

  const { name, type: dataType } = keyDef;

  const mapped = {
    name,
    keyType: KEY_TYPES[srcKey],
  };

  const attributeDefinition = {
    AttributeName: name,
    AttributeType: DATA_TYPE_MAP[dataType],
  };
  const attributeDestination = attrDst || dstObject;
  mapper.setKeyValue(attributeDestination, 'AttributeDefinitions[]+', attributeDefinition);

  return mapper(mapped, keyMapping);
};

// eslint-disable-next-line no-unused-vars
const capacityUnitsTransform = (srcValue, srcObject, dstObject, srcKey, dstKey) => {
  if (!(srcKey in srcObject)) {
    return undefined;
  }

  mapper.setKeyValue(dstObject, 'BillingMode', 'PROVISIONED');
  return srcValue;
};

const createSecondaryIndexMapping = (attrDst) => ({
  name: 'IndexName',
  partitionKey: {
    key: 'KeySchema[]+',
    transform: createKeyTransform(attrDst),
  },
  sortKey: {
    key: 'KeySchema[]+',
    transform: createKeyTransform(attrDst),
  },
  projection: {
    key: 'Projection',
    default: DEFAULT_PROJECTION,
    // eslint-disable-next-line no-unused-vars
    transform: (srcValue, srcObject, dstObject, srcKey, dstKey) => {
      const mapped = {};
      let projectionType;
      if (Array.isArray(srcValue)) {
        mapped.NonKeyAttributes = srcValue;
        projectionType = 'include';
      } else {
        projectionType = srcValue;
      }

      mapped.ProjectionType = PROJECTION_TYPE_MAP[projectionType];
      return mapped;
    },
  },
  readUnits: {
    key: 'ProvisionedThroughput.ReadCapacityUnits',
    // eslint-disable-next-line no-unused-vars
    transform: (srcValue, srcObject, dstObject, srcKey, dstKey) => {
      if (!(srcKey in srcObject)) {
        return undefined;
      }
      return srcValue;
    },
  },
  writeUnits: {
    key: 'ProvisionedThroughput.WriteCapacityUnits',
    // eslint-disable-next-line no-unused-vars
    transform: (srcValue, srcObject, dstObject, srcKey, dstKey) => {
      if (!(srcKey in srcObject)) {
        return undefined;
      }
      return srcValue;
    },
  },
});

const propertiesMapping = {
  name: 'TableName',
  partitionKey: {
    key: 'KeySchema[]+',
    transform: createKeyTransform(),
  },
  sortKey: {
    key: 'KeySchema[]+',
    transform: createKeyTransform(),
  },
  readUnits: {
    key: 'ProvisionedThroughput.ReadCapacityUnits',
    transform: capacityUnitsTransform,
  },
  writeUnits: {
    key: 'ProvisionedThroughput.WriteCapacityUnits',
    transform: capacityUnitsTransform,
  },
  indexes: {
    // eslint-disable-next-line no-unused-vars
    transform: (srcValue, srcObject, dstObject, srcKey, dstKey) => {
      if (!Array.isArray(srcValue)) {
        return;
      }

      srcValue.forEach((index) => {
        const secondaryIndexMapping = createSecondaryIndexMapping(dstObject);
        if ('partitionKey' in index) {
          // GlobalSecondaryIndex
          const mappedIndex = mapper(index, secondaryIndexMapping);
          mapper.setKeyValue(dstObject, 'GlobalSecondaryIndexes[]+', mappedIndex);
        } else {
          // LocalSecondaryIndex
          const localIndex = {
            ...index,
            partitionKey: srcObject.partitionKey,
          };
          const mappedIndex = mapper(localIndex, secondaryIndexMapping);
          mapper.setKeyValue(dstObject, 'LocalSecondaryIndexes[]+', mappedIndex);
        }
      });
    },
  },
  tags: {
    key: 'Tags',
    // eslint-disable-next-line no-unused-vars
    transform: (srcValue, srcObject, dstObject, srcKey, dstKey) => {
      if (!(srcKey in srcObject)) {
        return undefined;
      }

      return Object.entries(srcValue).map(([key, value]) => ({
        Key: key,
        Value: value,
      }));
    },
  },
  streamType: {
    key: 'StreamSpecification.StreamViewType',
    // eslint-disable-next-line no-unused-vars
    transform: (srcValue, srcObject, dstObject, srcKey, dstKey) => {
      if (!(srcKey in srcObject)) {
        return undefined;
      }
      return STREAM_TYPE_MAP[srcValue];
    },
  },
  ttlKey: {
    key: 'TimeToLiveSpecification',
    // eslint-disable-next-line no-unused-vars
    transform: (srcValue, srcObject, dstObject, srcKey, dstKey) => {
      if (!(srcKey in srcObject)) {
        return undefined;
      }
      return {
        AttributeName: srcValue,
        Enabled: true,
      };
    },
  },
  encrypted: {
    key: 'SSESpecification.SSEEnabled',
    // eslint-disable-next-line no-unused-vars
    transform: (srcValue, srcObject, dstObject, srcKey, dstKey) => {
      if (!(srcKey in srcObject)) {
        return undefined;
      }
      return srcValue;
    },
  },
  pointInTimeRecovery: {
    key: 'PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled',
    // eslint-disable-next-line no-unused-vars
    transform: (srcValue, srcObject, dstObject, srcKey, dstKey) => {
      if (!(srcKey in srcObject)) {
        return undefined;
      }
      return srcValue;
    },
  },
};

module.exports = (plugin, table) => {
  const mappedTable = mapper(table, propertiesMapping);
  const mergedTable = merge(DEFAULT_PROPERTIES, mappedTable);

  // Deduplicate Attribute Definitions
  mergedTable.AttributeDefinitions = dedupe(
    mergedTable.AttributeDefinitions,
    (({ AttributeName }) => AttributeName),
  );

  plugin.debug('Created properties', JSON.stringify(mergedTable));

  return mergedTable;
};
