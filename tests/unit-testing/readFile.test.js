const path = require("path");
const {
  readFile,
  getFilePaths,
  getContentType,
  createFile,
  validateInitRan,
  validateProfileName,
  fileExists,
} = require("../../src/utils/utilities");
const fs = require('fs');

const ANSWERS_FILE_PATH = path.join(__dirname, ".", "test-answers.json");
const data = {
  "testprofile": {
    "PROFILE_NAME": "test_profile",
    "WAITING_ROOM_NAME": "test_room",
    "REGION": "us-west-2",
    "PROTECT_URL": "https://www.example.com",
    "RATE": 100
  }
}

const BAD_ANSWERS_FILE_PATH = path.join(__dirname, ".", "not-answers.json");
let profiles;

beforeAll(async () => {
  await createFile(JSON.stringify(data), ANSWERS_FILE_PATH);
  profiles = JSON.parse(await readFile(ANSWERS_FILE_PATH));
});

afterAll(async () => {
  await fs.promises.unlink(ANSWERS_FILE_PATH);
});

describe("Testing for fileExists and createFile", () => {
  test("Dummy config file was created and exists", () => {
    expect(fileExists(ANSWERS_FILE_PATH)).toBe(true);
  });
});

describe("Testing for readFile util", () => {

  test("If config file exists it returns an object", async () => {
    expect(typeof profiles).toBe("object");
  });

  test("If config does not exist readFile throws an error", async () => {
    try {
      await readFile(BAD_ANSWERS_FILE_PATH);
    } catch (err) {
      expect(err.message).toMatch("no such file or directory");
    }
  });
});

describe("Testing for validateProfileName", () => {
  
  test("validateProfileName validates a profile name", async () => {
    expect(validateProfileName('%^&*$(#', profiles)).toBe(false);
    expect(validateProfileName("testprofile", profiles)).toBe(true);
  });
});

describe("Testing for validInitRan", () => {
  test("If validInitRan return true else return false", async () => {
    expect(await validateInitRan(ANSWERS_FILE_PATH)).toBe(true);
    expect(await validateInitRan(BAD_ANSWERS_FILE_PATH)).toBe(false);
  });
});

describe("Testing for get content type", () => {
  test(".gif is an image content type", () => {
    expect(getContentType('gif')).toBe('image/gif')
  });

  test(".js is a javascript extension", () => {
    expect(getContentType('js')).toBe('text/javascript');
  });
});

describe("Testing for getFilePaths method", () => {
  test("Get file paths returns the files paths of a directory", () => {
    let filePaths = getFilePaths(__dirname)

    expect(filePaths).toContain(path.join(__dirname, 'readFile.test.js'));
  });
});

