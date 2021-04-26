const path = require("path");
const { promptQuestions } = require("../utils/promptQuestions");
const { createFile, fileExists, readFile } = require("../utils/utilities");

const ANSWERS_FILE_PATH = path.join(
  __dirname,
  "..",
  "config",
  "user-answers.json"
);

module.exports = async () => {
  const answers = await promptQuestions();
  const length = Object.keys(answers).length;

  const profile = {
    [answers.PROFILE_NAME]: answers
  }

  if (length === 5) {
    let fileFound = await fileExists(ANSWERS_FILE_PATH);

    if(!fileFound) {
      await createFile(JSON.stringify(profile), ANSWERS_FILE_PATH);
    } else {
      const profiles = JSON.parse(await readFile(ANSWERS_FILE_PATH));

      profiles[answers.PROFILE_NAME] = profile[answers.PROFILE_NAME];
      await createFile(JSON.stringify(profiles), ANSWERS_FILE_PATH);
    }
  }
};
