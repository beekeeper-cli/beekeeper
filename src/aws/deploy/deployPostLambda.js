/**
 * Exports an async function that deploys our post queue Lambda, which is the Lambda that pulls tokens off the SQS queue.
 * @module deployPostLambda
 */
const {
  LambdaClient,
  CreateFunctionCommand,
  PutFunctionConcurrencyCommand,
} = require("@aws-sdk/client-lambda");
const logger = require("../../utils/logger")("dev");
const fs = require("fs");

/**
 * Function creates a post-queue Lambda that pulls tokens from the queue and writes them to the database.
 * @param {LambdaClient} lambda Looks like `new LambdaClient({ region })`
 * @param {String} lambdaName A constant `beekeeper-${PROFILE_NAME}-postlambda`
 * @param {String} sqsUrl URL of the sqs queue returned by `deploySQS.js`
 * @param {String} code This is the path of the index.js.zip file holding the code for this Lambda.
 * @param {String} roleArn Amazon resource number for the kitchen sink role returned by `createRole()`
 * @param {String} region A constant destructured from the CLI user's answers in `deploy.js`. Like "us-east-2".
 * @param {String} dynamoName Constant initialized in `deploy.js`, looks like `beekeeper-${PROFILE_NAME}-ddb`
 * @param {Number} rate A constant destructured from answers in the CLI, used by the frontend JavaScript to show dynamic information to the user in waiting room.
 * @returns {String} ARN of this Lambda
 */
const createPostLambda = async (
  lambda,
  lambdaName,
  sqsUrl,
  code,
  roleArn,
  region,
  dynamoName,
  rate
) => {
  let RATE = (rate / 10).toString();
  const params = {
    FunctionName: lambdaName,
    Role: roleArn,
    Handler: "index.handler",
    Runtime: "nodejs12.x",
    Description: "consumerLambda",
    Timeout: 60,
    Environment: {
      Variables: {
        SQS_URL: sqsUrl,
        REGION: region,
        TABLE_NAME: dynamoName,
        RATE: RATE
      },
    },
    Code: { ZipFile: code },
  };

  const command = new CreateFunctionCommand(params);

  try {
    const { FunctionArn } = await lambda.send(command);
    logger.debugSuccess(`Successfully created PostLambda: ${FunctionArn}`);
    return FunctionArn;
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

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
 * Exports deployPostLambda
 * @param {String} region A constant destructured from the CLI user's answers in deploy.js. Like "us-east-2".
 * @param {String} lambdaName A constant `beekeeper-${PROFILE_NAME}-postlambda`
 * @param {String} sqsUrl URL of the sqs queue returned by `deploySQS.js`
 * @param {String} asset This is the path of the index.js.zip file holding the code for this Lambda
 * @param {String} roleArn Amazon resource number for the kitchen sink role returned by `createRole()`
 * @param {String} dynamoName Constant initialized in `deploy.js`, looks like `beekeeper-${PROFILE_NAME}-ddb`
 * @param {Number} rate A constant destructured from answers in the CLI, used by the frontend JavaScript to show dynamic information to the user in waiting room
 * @returns {String} Returns the ARN of the post queue Lambda
 */
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
    dynamoName,
    rate
  );
  await setLambdaConcurrency(lambda, lambdaName, rate);
  return lambdaArn;
};
