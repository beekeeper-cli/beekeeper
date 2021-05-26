/**
 * Exports an async function that deploys our DRT Lambda.
 * @module deployDRTLambda
 */
 const {
  LambdaClient,
  CreateFunctionCommand,
  PutFunctionConcurrencyCommand,
} = require("@aws-sdk/client-lambda");
const logger = require("../../utils/logger")("dev");
const fs = require("fs");

/**
 * Function creates a DRT Lambda that performs health checks on the client endpoint and changest the RATE variable on the trigger lambda.
 * @param {LambdaClient} lambda 
 * @param {String} lambdaName 
 * @param {String} triggerLambdaName 
 * @param {String} dynamoName 
 * @param {String} code 
 * @param {String} roleArn 
 * @param {String} region 
 * @param {String} protectUrl 
 * @returns {String} The ARN of the DRT lambda
 */
const createPreLambda = async (
  lambda,
  lambdaName,
  triggerLambdaName,
  dynamoName,
  code,
  roleArn,
  region,
  protectUrl
) => {
  const params = {
    FunctionName: lambdaName,
    Role: roleArn,
    Handler: "index.handler",
    Runtime: "nodejs12.x",
    Description: "Dynamic-Rate-Throttling-Lambda",
    Timeout: 60,
    Environment: {
      Variables: {
        TABLE_NAME: dynamoName,
        FUNC_NAME: triggerLambdaName,
        REGION: region,
        END_POINT: protectUrl,
      },
    },
    Code: { ZipFile: code },
  };

  const command = new CreateFunctionCommand(params);

  try {
    const { FunctionArn } = await lambda.send(command);
    logger.debugSuccess(`Successfully created DRT Lambda: ${FunctionArn}`);
    return FunctionArn;
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Limits lambda concurrency to 1
 * @param {LambdaClient} lambda 
 * @param {String} lambdaName 
 */
const setLambdaConcurrency = async (lambda, lambdaName) => {

  const params = {
    FunctionName: lambdaName,
    ReservedConcurrentExecutions: 1,
  };

  const command = new PutFunctionConcurrencyCommand(params);

  try {
    await lambda.send(command);
    logger.debugSuccess(`Successfully set DRT-Concurrency: ${1}`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Exports deployDRTLambda
 * @param {String} region 
 * @param {String} lambdaName 
 * @param {String} triggerLambdaName 
 * @param {String} dynamoName 
 * @param {String} asset 
 * @param {String} roleArn 
 * @param {String} protectUrl 
 * @returns {String} Return ARN of DRT lambda
 */
module.exports = async (
  region,
  lambdaName,
  triggerLambdaName,
  dynamoName,
  asset,
  roleArn,
  protectUrl
) => {
  let code = fs.readFileSync(asset);

  // Create a Lambda client service object
  const lambda = new LambdaClient({ region });

  // Create pre lambda
  const lambdaArn = await createPreLambda(
    lambda,
    lambdaName,
    triggerLambdaName,
    dynamoName,
    code,
    roleArn,
    region,
    protectUrl
  );

  await setLambdaConcurrency(lambda, lambdaName);

  return lambdaArn;
};
