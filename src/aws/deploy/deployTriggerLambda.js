/**
 * Exports an async function that deploys our post queue Lambda, which is the Lambda that pulls tokens off the SQS queue.
 * @module deployTriggerLambda
 */
 const {
  LambdaClient,
  CreateFunctionCommand,
} = require("@aws-sdk/client-lambda");
const logger = require("../../utils/logger")("dev");
const fs = require("fs");


const createTriggerLambda = async (
  lambda,
  lambdaName,
  code,
  roleArn,
  postLambdaArn,
  region,
  rate
) => {
  let RATE = (rate / 10).toString();
  const params = {
    FunctionName: lambdaName,
    Role: roleArn,
    Handler: "index.handler",
    Runtime: "nodejs12.x",
    Description: "triggerLambda",
    Timeout: 60,
    Environment: {
      Variables: {
        REGION: region,
        RATE: RATE,
        POST_LAMBDA_ARN: postLambdaArn,
      },
    },
    Code: { ZipFile: code },
  };

  const command = new CreateFunctionCommand(params);

  try {
    const { FunctionArn } = await lambda.send(command);
    logger.debugSuccess(`Successfully created TriggerLambda: ${FunctionArn}`);
    return FunctionArn;
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

module.exports = async (
  region,
  lambdaName,
  asset,
  roleArn,
  postLambdaArn,
  rate
) => {
  let code = fs.readFileSync(asset);

  // Create a Lambda client service object
  const lambda = new LambdaClient({ region });

  // Create post lambda
  const lambdaArn = await createTriggerLambda(
    lambda,
    lambdaName,
    code,
    roleArn,
    postLambdaArn,
    region,
    rate
  );

  return lambdaArn;
};