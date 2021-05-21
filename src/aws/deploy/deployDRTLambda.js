
 const {
  LambdaClient,
  CreateFunctionCommand,
  PutFunctionConcurrencyCommand,
} = require("@aws-sdk/client-lambda");
const logger = require("../../utils/logger")("dev");
const fs = require("fs");


const createPreLambda = async (
  lambda,
  lambdaName,
  consumerLambdaName,
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
        FUNC_NAME: consumerLambdaName,
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

module.exports = async (
  region,
  lambdaName,
  consumerLambdaName,
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
    consumerLambdaName,
    dynamoName,
    code,
    roleArn,
    region,
    protectUrl
  );

  await setLambdaConcurrency(lambda, lambdaName);

  return lambdaArn;
};
