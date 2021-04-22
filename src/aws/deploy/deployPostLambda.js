const {
  LambdaClient,
  CreateFunctionCommand,
  PutFunctionConcurrencyCommand,
} = require("@aws-sdk/client-lambda");
const logger = require("../../utils/logger")("deployPostLambda");
const fs = require("fs");

const createPostLambda = async (
  lambda,
  lambdaName,
  sqsUrl,
  code,
  roleArn,
  region,
  dynamoName
) => {
  const params = {
    FunctionName: lambdaName,
    Role: roleArn,
    Handler: "index.handler",
    Runtime: "nodejs12.x",
    Description: "consumerLambda",
    Environment: {
      Variables: {
        SQS_URL: sqsUrl,
        REGION: region,
        TABLE_NAME: dynamoName,
      },
    },
    Code: { ZipFile: code },
  };

  const command = new CreateFunctionCommand(params);

  try {
    const { FunctionArn } = await lambda.send(command);
    logger.log(`Successfully created PostLambda: ${FunctionArn}`);
    return FunctionArn;
  } catch (err) {
    logger.warning("Error", err);
  }
};

const setLambdaConcurrency = async (lambda, lambdaName, rate) => {
  // Assumption for now is rate is requests per minute, and one lambda does 10 messages per minute pursuant to CloudFront cronjob
  const reserveAmount = rate / 10;

  const params = {
    FunctionName: lambdaName,
    ReservedConcurrentExecutions: reserveAmount,
  };

  const command = new PutFunctionConcurrencyCommand(params);

  try {
    await lambda.send(command);
    logger.log(`Successfully set LambdaReserveConcurrency: ${rate}`);
  } catch (err) {
    logger.warning("Error", err);
  }
};

module.exports = async (
  region,
  lambdaName,
  sqsUrl,
  asset,
  roleArn,
  dynamoName,
  rate
) => {
  let code = fs.readFileSync(asset);

  // Create a Lambda client service object
  const lambda = new LambdaClient({ region });

  // Create post lambda
  const lambdaArn = await createPostLambda(
    lambda,
    lambdaName,
    sqsUrl,
    code,
    roleArn,
    region,
    dynamoName
  );
  await setLambdaConcurrency(lambda, lambdaName, rate);
  return lambdaArn;
};
