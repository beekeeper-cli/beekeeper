const path = require("path");
const { promptQuestions } = require("../utils/promptQuestions");
const { createFile } = require("../utils/utilities");

const ANSWERS_FILE_PATH = path.join(
  __dirname,
  "..",
  "config",
  "user-answers.json"
);

module.exports = async () => {
  const answers = await promptQuestions();
  const length = Object.keys(answers).length;

  if (length === 3) {
    await createFile(JSON.stringify(answers), ANSWERS_FILE_PATH);
  }
};
