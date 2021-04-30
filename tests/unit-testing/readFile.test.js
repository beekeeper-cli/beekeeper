const path = require("path");
const { readFile } = require("../../src/utils/utilities");

describe('Testing for readFile util', () => {
  const ANSWERS_FILE_PATH = path.join(
    __dirname,
    ".",
    "test-answers.json"
  );

  const BAD_ANSWERS_FILE_PATH = path.join(
    __dirname,
    ".",
    "not-answers.json"
  );
  
  test('If config file exists it returns an object', async () => {
    
    const profiles = Object.values(JSON.parse(await readFile(ANSWERS_FILE_PATH)));

    expect(typeof profiles).toBe("object");
  });

  test('If config does not exist readFile throws an error', async () => {
    
    try {
      await readFile(BAD_ANSWERS_FILE_PATH)
    } catch (err) {
      expect(err.message).toMatch('no such file or directory');
    }
  });
});
