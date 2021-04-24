const path = require("path");
const chalk = require("chalk");
const logger = require("../utils/logger")("dev");
const { readFile, fileExists } = require("../utils/utilities");

const ANSWERS_FILE_PATH = path.join(
  __dirname,
  "..",
  "config",
  "user-answers.json"
);

module.exports = async () => {
  let fileFound = await fileExists(ANSWERS_FILE_PATH);

  // Check if user executed `sealbuzz start` first
  if (!fileFound) {
    console.log("");
    logger.error("No configuration file detected: run 'sealbuzz start' first.");
    return;
  }

  const { WAITING_ROOM_NAME, REGION, PROTECT_URL } = JSON.parse(
    await readFile(ANSWERS_FILE_PATH)
  );

  console.log("")

  console.log(`${chalk.green.bold("✔")} ${chalk.bold("Waiting room name: ")} ${WAITING_ROOM_NAME}`);

  console.log(`${chalk.green.bold("✔")} ${chalk.bold("Region: ")} ${REGION}`);

  console.log(`${chalk.green.bold("✔")} ${chalk.bold("Protected URL: ")} ${PROTECT_URL}`);
};
