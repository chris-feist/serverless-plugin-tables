# serverless-plugin-tables

This [Serverless][link-serverless] plugin makes adding tables to your service file easy.

[![Serverless][icon-serverless]][link-serverless]
[![License][icon-license]][link-license]
[![NPM Total Downloads][icon-npm-total-downloads]][link-npm]
[![NPM Version][icon-npm-version]][link-npm]
[![Build Status][icon-build-status]][link-build]
[![Coverage][icon-coverage]][link-coverage]

## Benefits
- Less boilerplate
- Common defaults
- Integrates with existing resources
- Handles deployment limits
  - [Dynamo][link-dynamo-deployment-limit]

# Contents
- [Installation](#installation)
- [Usage](#usage)
- [Providers](#providers)
  - [AWS](#aws)
    - [DynamoDB](#dynamo-db)
  - [Others](#others)

## Installation

Install the dependency:
```sh
yarn add -D serverless-plugin-tables
```
or
```sh
npm install -D serverless-plugin-tables
```

Add `serverless-plugin-tables` to your `serverless.yml` file:

```yaml
plugins:
  - serverless-plugin-tables
```

## Usage

Add a `tables` property the resources in your `serverless.yml` file and define tables by name according to the [provider](#providers) specs.

```yaml
service: my-service

plugins:
  - serverless-plugin-tables

provider:
  ...

resources:
  tables:
    MyTable1:
      ...
    MyTable2:
      ...
```

### Plugin options

The plugin can be configured by defining a custom `tables` object in your `serverless.yml` file. Database specific options should be defined as properties under their database type, like `dynamo`. See database specs for related options. Example options `serverless.yml`:

```yaml
custom:
  tables:
    dynamo:
      deploymentBatchSize: 5
```

# Providers

#### Common properties:

| Property     | Required | Default Value | Description |
|--------------|----------|---------------|-------------|
| name         | *false*  | The table key | The name of the table |
| type         | *false*  | Varies by provider | The database type. Please refer to corresponding provider and database sections below. |

## AWS

#### Common properties:

| Property     | Required | Default Value | Description |
|--------------|----------|---------------|-------------|
| resourceName | *false*  | `'{pascalCase(tableName)}DynamoDbTable'` | The CloudFormation resource name. The default runs your table name through a pascal case transformation. |
| type         | *false*  | `'dynamo'` | The database type. Please refer to corresponding database sections below. |
| template     | *false*  | `null` | Custom CloudFormation template overrides. This allows you to implement features not covered, override the generated output, or do whatever other crazy stuff you have in mind 😀 |

#### Example
```yaml
resources:
  tables:
    # Simple DynamoDB Table
    Music:
      partitionKey: Artist
      sortKey: SongTitle
      indexes:
        - name: GenreByTitleIndex
          partitionKey: Genre
          sortKey: AlbumTitle

    # Complex DynamoDB Table
    People:
      name: ${env:PEOPLE_TABLE_NAME}
      resourceName: FavoritePeopleDynamoTable
      type: dynamo
      partitionKey: personID
      sortKey: state
      readUnits: 5
      writeUnits: 5
      indexes:
        # Global Secondary Index
        - name: EmailIndex
          partitionKey: email
          projection: all
          readUnits: 2
          writeUnits: 2
        # Local Secondary Index
        - name: PersonByCreatedTimeIndex
          sortKey: 
            name: createdTime
            type: number
          projection: keys
          readUnits: 2
          writeUnits: 2
        # Local Secondary Index with projection
        - name: PersonByAgeIndex
          sortKey: 
            name: age
            type: number
          projection:
            - dob
            - firstName
            - lastName
          readUnits: 2
          writeUnits: 2
      streamType: newItem
      ttlKey: expirationTime
      encrypted: true
      pointInTimeRecovery: true
      tags:
        STAGE: test
        TEAM: backend      
      template: 
        # Override the computed CF template
        Properties: 
          ProvisionedThroughput:
            ReadCapacityUnits : 1
```

### DynamoDB

##### Type: `dynamo`

_Note that DynamoDB tables default to using [on-demand billing mode][link-dynamo-on-demand-billing]_.

#### Options

| Property     | Default Value | Description |
|--------------|----------|-------------|
| deploymentBatchSize | `10` | The deployment batch size. Do not exceed the [AWS limits][link-dynamo-deployment-limit] |

#### Properties:

| Property     | Required | Description |
|--------------|----------|-------------|
| partitionKey | **true** | The partition key. Refer to [keys](#dynamo-keys) |
| sortKey | *false* | The sort key. Refer to [keys](#dynamo-keys) |
| readUnits | *false* <sup>[1](#footnote-dynamo-provisioned-units)</sup> | The provisioned read units. Setting this changes the table to [provisioned][link-dynamo-provisioned-billing] billing mode. |
| writeUnits | *false* <sup>[1](#footnote-dynamo-provisioned-units)</sup>  | The provisioned write units. Setting this changes the table to [provisioned][link-dynamo-provisioned-billing] billing mode. |
| indexes | *false* | List of secondary [indexes](#dynamo-indexes)  |
| streamType | *false* | The [stream type][link-dynamo-stream-types] of the table. See [Stream Types](#dynamo-stream-types) for valid values. |
| ttlKey | *false* | The [Time To Live][link-dynamo-ttl] field |
| encrypted | *false* | Enable [encryption][link-dynamo-encryption] |
| pointInTimeRecovery | *false* | Enable [Point-in-Time Recovery][link-dynamo-recovery] |
| tags | *false* | Key-value pairs of [resource tags][link-dynamo-tags] |

<a name="footnote-dynamo-provisioned-units">[1]</a>: Both read and write units are required if one is defined

#### <a name="dynamo-keys"></a> Keys:

Keys can be a `string` or an `object`. If a string is provided, then that will be the key name and it will be of data type `string`.

| Property     | Required | Description |
|--------------|----------|-------------|
| name         | **true** | The name of the key |
| type         | **true** | The [data type](#dynamo-data-types) of the key |

#### <a name="dynamo-data-types"></a> Data Types:

_Corresponds to [DynamoDB Data Types][link-dynamo-data-types]_

| Value        | Description |
|--------------|-------------|
| `string`     | String |
| `number`     | Number |
| `binary`     | Binary |
| `boolean`    | Boolean |
| `list`       | List |
| `map`        | Map |
| `numberSet`  | Number Set |
| `stringSet`  | String Set |
| `binarySet`  | Binary Set |
| `null`       | Null |

#### <a name="dynamo-indexes"></a>Indexes:

Indexes can be [Global][link-dynamo-gsi] or [Local][link-dynamo-lsi] indexes. The difference being that Local indexes share the same partition key as the table. Therefore, to create a Local index, just omit the `partitionKey` field.

| Property     | Required | Description |
|--------------|----------|-------------|
| name | **true** | The name of the index |
| partitionKey | *false* <sup>[2](#footnote-dynamo-index-key)</sup>  | The partition key. Refer to [keys](#keys) |
| sortKey | *false* <sup>[2](#footnote-dynamo-index-key)</sup>  | The sort key. Refer to [keys](#keys) |
| readUnits | *false* <sup>[3](#footnote-dynamo-index-units)</sup>  | The provisioned read units |
| writeUnits | *false* <sup>[3](#footnote-dynamo-index-units)</sup>  | The provisioned write units |
| projection | *false* | The [projected fields][link-dynamo-index-projection]. Possible values include:<br>`all` - **[Default]** The entire record<br>`keys` - Only keys<br>A list of fields |

<a name="footnote-dynamo-index-key">[2]</a>: At least one key is required

<a name="footnote-dynamo-index-units">[3]</a>: Required if defined for the table

#### <a name="dynamo-stream-types"></a> Stream Types:

_Corresponds to [DynamoDB Stream Types][link-dynamo-stream-types]_

| Value        | Description |
|--------------|-------------|
| `newItem`    | Enable stream with new item/image only |
| `oldItem`    | Enable stream with old item/image only |
| `both`       | Enable stream with new and old items |
| `keys`       | Enable stream with keys only |

## Others

If your provider or database isn't supported, [open an issue to request it!][link-open-issue]

[icon-serverless]: http://public.serverless.com/badges/v3.svg
[icon-license]: https://img.shields.io/github/license/chris-feist/serverless-plugin-tables.svg
[icon-npm-total-downloads]: https://img.shields.io/npm/dt/serverless-plugin-tables.svg
[icon-npm-version]: https://img.shields.io/npm/v/serverless-plugin-tables.svg
[icon-npm-license]: https://img.shields.io/npm/l/serverless-plugin-tables.svg
[icon-build-status]: https://travis-ci.com/chris-feist/serverless-plugin-tables.svg?branch=master
[icon-coverage]: https://img.shields.io/codecov/c/github/chris-feist/serverless-plugin-tables/master.svg

[link-serverless]: http://www.serverless.com/
[link-license]: ./LICENSE
[link-npm]: https://www.npmjs.com/package/serverless-plugin-tables
[link-build]: https://travis-ci.com/chris-feist/serverless-plugin-tables
[link-coverage]: https://codecov.io/gh/chris-feist/serverless-plugin-tables
[link-dynamo-deployment-limit]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Limits.html#limits-api
[link-open-issue]: https://github.com/chris-feist/serverless-plugin-tables/issues
[link-dynamo-data-types]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html#HowItWorks.DataTypes
[link-dynamo-on-demand-billing]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadWriteCapacityMode.html#HowItWorks.OnDemand
[link-dynamo-provisioned-billing]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadWriteCapacityMode.html#HowItWorks.ProvisionedThroughput.Manual
[link-dynamo-stream-types]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html
[link-dynamo-ttl]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html
[link-dynamo-encryption]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/EncryptionAtRest.html
[link-dynamo-recovery]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/PointInTimeRecovery.html
[link-dynamo-tags]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Tagging.html
[link-dynamo-gsi]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html
[link-dynamo-lsi]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/LSI.html
[link-dynamo-index-projection]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/SecondaryIndexes.html
