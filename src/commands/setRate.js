/**
 * Changes the postLambda rate of a deployed waiting room.
 * @module setRate
 */

const {
  LambdaClient,
  UpdateFunctionConfigurationCommand,
  GetFunctionConfigurationCommand
} = require("@aws-sdk/client-lambda");
const chalk = require("chalk");
const path = require("path");
const logger = require("../utils/logger")("dev");
const { readFile, validateInitRan, validateProfileName, createFile } = require("../utils/utilities");


const ANSWERS_FILE_PATH = path.join(
  __dirname,
  "..",
  "config",
  "user-answers.json"
);

/**
 * Updates the environmental variables on an existing lambda.
 * @param {LambdaClient} lambda The AWS lambda client
 * @param {string} lambdaName The name of the postLambda
 * @param {object} environment The object of environmental variables
 * @param {number} rate The new rate environmental variable
 */

const updateLambdaConfig = async (lambda, lambdaName, environment, rate) => {
  environment.Variables.RATE = (Number(rate) / 10).toString();
  
  const params = {
    FunctionName: lambdaName,
    Environment: environment
  };

  const command = new UpdateFunctionConfigurationCommand(params);

  try {
    await lambda.send(command);
    logger.debugSuccess(`Successfully updated PostLambda environment variable`);
  } catch (err) {
    logger.debugError("Error", err);
  }
}

/**
 * Function sets a reserce concurrency amount of Lambdas for post-queue and uses the rate to determine it, keeping in mind there are a specific number of loops happening in the post Lambda code in its index.js that together work out to be the rate desired.
 * @param {LambdaClient} lambda Looks like `new LambdaClient({ region })`
 * @param {String} lambdaName A constant `beekeeper-${PROFILE_NAME}-postlambda`
 * @param {Number} rate A constant destructured from answers in the CLI, used by the frontend JavaScript to show dynamic information to the user in waiting room.
 */
const setLambdaConcurrency = async (lambda, lambdaName, rate) => {
  // Assumption for now is rate is requests per minute, and one lambda does 10 messages per minute pursuant to CloudFront cronjob
  const reserveAmount = 1 + Math.floor(rate / 1500);

  const params = {
    FunctionName: lambdaName,
    ReservedConcurrentExecutions: reserveAmount,
  };

  const command = new PutFunctionConcurrencyCommand(params);

  try {
    await lambda.send(command);
    logger.debugSuccess(`Successfully set LambdaReserveConcurrency: ${reserveAmount}`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Gets the current configuration object of the postLambda.
 * @param {LambdaClient} lambda LambdaClient
 * @param {string} lambdaName The name of the postLambda
 * @returns {object} The current configuration object
 */

const getLambdaConfig = async (lambda, lambdaName) => {
  const params = {
    FunctionName: lambdaName
  };

  const command = new GetFunctionConfigurationCommand(params);

  try {
    const lambdaConfig = await lambda.send(command);
    logger.debugSuccess(`Successfully retrieved PostLambda configuration`);
    return lambdaConfig;
  } catch (err) {
    logger.debugError("Error", err);
  }
}

/**
 * Validates a new rate.
 * @param {number} rate The new rate
 */

const validateRate = (rate) => {
  if (rate < 10 || rate > 3000) {
    logger.error(`Rate ${rate} is outside of range 10 - 3000.`)
    throw new Error("InvalidRate");
  }
}

/**
 * Exports the setRate function.
 * @param {string} profileName The name of the profile to commit the rate change to
 * @param {number} newRate The new rate
 * @returns {undefined}
 */

module.exports = async (profileName, newRate) => {
  const initRan = await validateInitRan(ANSWERS_FILE_PATH);
  if (!initRan) return;

  const profiles = JSON.parse(await readFile(ANSWERS_FILE_PATH));
  const validProfileName = validateProfileName(profileName, profiles, "set-rate");
  if (!validProfileName) return;

  const POST_LAMBDA_NAME = `beekeeper-${profileName}-postlambda`;
  const { REGION } = profiles[profileName];

  // Create a Lambda client service object
  const lambda = new LambdaClient({ REGION });

  try {
    validateRate(newRate);
    const { Environment:environment } = await getLambdaConfig(lambda, POST_LAMBDA_NAME);
    await updateLambdaConfig(lambda, POST_LAMBDA_NAME, environment, newRate);
    await setLambdaConcurrency(lambda, POST_LAMBDA_NAME, newRate);
    logger.highlight(`${chalk.green.bold("✔")} Successfully set postLambda rate to ${newRate}`);

    profiles[profileName].RATE = newRate;
    await createFile(JSON.stringify(profiles), ANSWERS_FILE_PATH);
  } catch (err) {
    logger.error(`Failed to set postLambda rate: ${newRate}.`);
    console.log("");
    console.log(`Note: If you haven't deployed a waiting room yet, please enter ${chalk.yellow.bold(`beekeeper deploy ${profileName}`)} first.`);
  }
};
