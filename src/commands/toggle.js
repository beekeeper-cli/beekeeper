/**
 * Toggles a deployed waitroom on or off.
 * @module toggle
 */

const {
  LambdaClient,
  UpdateFunctionConfigurationCommand,
  GetFunctionConfigurationCommand
} = require("@aws-sdk/client-lambda");
const chalk = require("chalk");
const path = require("path");
const logger = require("../utils/logger")("dev");
const { readFile, validateInitRan, validateProfileName } = require("../utils/utilities");


const ANSWERS_FILE_PATH = path.join(
  __dirname,
  "..",
  "config",
  "user-answers.json"
);

/**
 * Updates the preLambda with a new environment object.
 * @param {LambdaClient} lambda The LambdaClient object
 * @param {string} lambdaName The name of the preLambda
 * @param {object} environment The environment object of the preLambda
 * @param {string} waitroomOnOff The new value for the WAITROOM_ON environmental variable
 */

const updateLambdaConfig = async (lambda, lambdaName, environment, waitroomOnOff) => {
  environment.Variables.WAITROOM_ON = waitroomOnOff;
  
  const params = {
    FunctionName: lambdaName,
    Environment: environment
  };

  const command = new UpdateFunctionConfigurationCommand(params);

  try {
    await lambda.send(command);
    logger.debugSuccess(`Successfully updated PreLambda environment variable`);
  } catch (err) {
    logger.debugError("Error", err);
  }
}

/**
 * 
 * @param {LambdaClient} lambda The AWS LambdaClient object
 * @param {string} lambdaName The name of the preLambda
 * @returns {object} The current configuration of the preLambda
 */

const getLambdaConfig = async (lambda, lambdaName) => {
  const params = {
    FunctionName: lambdaName
  };

  const command = new GetFunctionConfigurationCommand(params);

  try {
    const lambdaConfig = await lambda.send(command);
    logger.debugSuccess(`Successfully retrieved PreLambda configuration`);
    return lambdaConfig;
  } catch (err) {
    logger.debugError("Error", err);
  }
}

/**
 * Exports the onOff function.
 * @param {string} onOff either "on" or "off"
 * @returns {function} a function that takes the profile name to turn on or off
 */

module.exports = (onOff) => {
  
  const WAITROOM_ON = onOff === "on" ? "true" : "false";

  return async (profileName) => {

    const initRan = await validateInitRan(ANSWERS_FILE_PATH);
    if (!initRan) return;
  
    const profiles = JSON.parse(await readFile(ANSWERS_FILE_PATH));
    const validProfileName = validateProfileName(profileName, profiles, onOff);
    if (!validProfileName) return;
  
    const PRE_LAMBDA_NAME = `beekeeper-${profileName}-prelambda`;
    const { REGION } = profiles[profileName];
    
    // Create a Lambda client service object
    const lambda = new LambdaClient({ region: REGION });
    try {
      const { Environment:environment } = await getLambdaConfig(lambda, PRE_LAMBDA_NAME);
      await updateLambdaConfig(lambda, PRE_LAMBDA_NAME, environment, WAITROOM_ON);
      logger.highlight(`${chalk.green.bold("✔")} Successfully turned ${onOff} waiting room`);
    } catch (err) {
      logger.error(`Failed to turn ${onOff} waiting room.`);
      console.log("");
      console.log(`Note: If you haven't deployed a waiting room yet, please enter ${chalk.yellow.bold(`beekeeper deploy ${profileName}`)} first.`);
    }
  }
};