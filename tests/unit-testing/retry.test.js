const retry = require("../../src/utils/retry");

describe('test retry utility', () => {
  beforeEach(async () => {
    jest.setTimeout(120000);
  });

  test('retry exists', () => {
    expect(typeof retry).toBe("function");
  });

  test('retry returns a value when function returns Success object', async () => {
    let successFunc = () => {
      return { status: "Success", response: 50 }
    }

    const value = await retry(() => successFunc());

    expect(value).toBe(50);
  });

  test('retry throws error when functioned is throttled', async () => {
    let errorFunc = () => {
      let err = new Error();
      err.Code = "Throttled";
      throw err;
    }

    let value;

    try {
      await retry(() => errorFunc());
    } catch (e) {
      value = e.message;
    }

    expect(value).toBe("Error");
  });
});