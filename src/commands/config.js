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

  // Check if user executed `sealbuzz init` first
  if (!fileFound) {
    console.log("");
    logger.error("No configuration file detected: run 'sealbuzz init' first.");
    return;
  }

  const { WAITING_ROOM_NAME, REGION, PROTECT_URL, RATE } = JSON.parse(
    await readFile(ANSWERS_FILE_PATH)
  );

  console.log("")

  console.log(`${chalk.green.bold("✔")} ${chalk.bold("Waiting room name: ")} ${WAITING_ROOM_NAME}`);

  console.log(`${chalk.green.bold("✔")} ${chalk.bold("Region: ")} ${REGION}`);

  console.log(`${chalk.green.bold("✔")} ${chalk.bold("Protected URL: ")} ${PROTECT_URL}`);
  
  console.log(`${chalk.green.bold("✔")} ${chalk.bold("Users allowed to enter per minute: ")} ${RATE}`);
};
