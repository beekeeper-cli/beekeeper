/**
 * Logs the contents of user-answers.json.
 * @module config
 */

const path = require("path");
const chalk = require("chalk");
const { readFile, validateInitRan } = require("../utils/utilities");

const ANSWERS_FILE_PATH = path.join(
  __dirname,
  "..",
  "config",
  "user-answers.json"
);

/**
 * Iterates through every profile in the user-answers.json file and logs the contents of each to the console.
 * @returns undefined
 */

module.exports = async () => {
  const initRan = await validateInitRan(ANSWERS_FILE_PATH);
  if (!initRan) return;

  const profiles = Object.values(JSON.parse(await readFile(ANSWERS_FILE_PATH)));
  
  profiles.forEach(profile => {
    console.log("")
    console.log(`${chalk.green.bold("✔")} ${chalk.bold("Profile name: ")} ${profile.PROFILE_NAME}`);
    console.log(`${chalk.green.bold("✔")} ${chalk.bold("Waiting room name: ")} ${profile.WAITING_ROOM_NAME}`);
    console.log(`${chalk.green.bold("✔")} ${chalk.bold("Region: ")} ${profile.REGION}`);
    console.log(`${chalk.green.bold("✔")} ${chalk.bold("Protected URL: ")} ${profile.PROTECT_URL}`);
    console.log(`${chalk.green.bold("✔")} ${chalk.bold("Users allowed to enter per minute: ")} ${profile.RATE}`);
    console.log(`${chalk.green.bold("✔")} ${chalk.bold("Dynamic Rate Throttling enabled: ")} ${profile.DRT}`);
  })
};
