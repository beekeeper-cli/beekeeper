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

const validateRate = (rate) => {
  if (rate < 10 || rate > 3000) {
    logger.error(`Rate ${rate} is outside of range 10 - 3000.`)
    throw new Error("InvalidRate");
  }
}

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
    logger.highlight(`${chalk.green.bold("✔")} Successfully set postLambda rate to ${newRate}`);

    profiles[profileName].RATE = newRate;
    await createFile(JSON.stringify(profiles), ANSWERS_FILE_PATH);
  } catch (err) {
    logger.error(`Failed to set postLambda rate: ${newRate}.`);
    console.log("");
    console.log(`Note: If you haven't deployed a waiting room yet, please enter ${chalk.yellow.bold(`beekeeper deploy ${profileName}`)} first.`);
  }
};
