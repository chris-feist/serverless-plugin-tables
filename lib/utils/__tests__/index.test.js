const { separateByType, dedupe } = require('../index');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('utils', () => {
  test('separateByType', () => {
    const tables = {
      DefaultTable1: {
        value: 1,
      },
      NoSqlTable1: {
        type: 'nosql',
        value: 2,
      },
      SqlTable1: {
        type: 'sql',
        value: 3,
      },
      SqlTable2: {
        name: 'MySqlTable',
        type: 'sql',
        value: 4,
      },
    };
    const defaultType = 'nosql';

    const result = separateByType(tables, defaultType);

    expect(result).toBeDefined();
    expect(result.sql).toHaveLength(2);
    expect(result.sql).toContainEqual({
      name: 'SqlTable1',
      type: 'sql',
      value: 3,
    });
    expect(result.sql).toContainEqual({
      name: 'MySqlTable',
      type: 'sql',
      value: 4,
    });
    expect(result.nosql).toHaveLength(2);
    expect(result.nosql).toContainEqual({
      name: 'DefaultTable1',
      value: 1,
    });
    expect(result.nosql).toContainEqual({
      name: 'NoSqlTable1',
      type: 'nosql',
      value: 2,
    });
  });

  test('dedupe default getter', () => {
    const array = [
      'a',
      'b',
      'c',
      'c',
      'b',
      'a',
    ];

    const result = dedupe(array);

    expect(result).toHaveLength(3);
    expect(result).toEqual(expect.arrayContaining(['a', 'b', 'c']));
  });

  test('dedupe custom getter', () => {
    const array = [
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 3 },
      { id: 2 },
      { id: 1 },
    ];
    const propGetter = ({ id }) => id;

    const result = dedupe(array, propGetter);

    expect(result).toHaveLength(3);
    expect(result).toContainEqual({ id: 1 });
  });

  test('dedupe no input', () => {
    const array = null;

    const result = dedupe(array);

    expect(result).toBe(array);
  });
});
