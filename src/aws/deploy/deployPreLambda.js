/**
 * Exports an async function that deploys our pre queue Lambda, which is the Lambda triggered by the API Gateway resource "/beekeeper", i.e. first time visitors.
 * @module deployPreLambda
 */
const {
  LambdaClient,
  CreateFunctionCommand,
  AddPermissionCommand,
} = require("@aws-sdk/client-lambda");
const logger = require("../../utils/logger")("dev");
const fs = require("fs");

/**
 * Function that creates the pre-queue Lambda. This deployment sets several environment variables so that the preLambda code in its index.js has access to these environment variables. This pre Lambda will generate a token, put that token in the SQS queue, and set custom response headers dependent on the status of the environment variables.
 * @param {LambdaClient} lambda Looks like `new LambdaClient({ region })`
 * @param {String} lambdaName A constant `beekeeper-${PROFILE_NAME}-prelambda`
 * @param {String} sqsUrl URL of the sqs queue returned by `deploySQS.js`
 * @param {String} code This is the path of the index.js.zip file holding the code for this Lambda.
 * @param {String} roleArn Amazon resource number for the kitchen sink role returned by `createRole()`
 * @param {String} region A constant destructured from the CLI user's answers in `deploy.js`. Like "us-east-2".
 * @param {String} s3ObjectRootDomain Constant `https://${bucketName}.s3.${region}.amazonaws.com`;
 * @param {String} protectUrl A constant destructured from the CLI user's answers in `deploy.js`. Like "https://www.example.com".
 * @returns {String} Returns the ARN of this pre queue Lambda
 */
const createPreLambda = async (
  lambda,
  lambdaName,
  sqsUrl,
  code,
  roleArn,
  region,
  s3ObjectRootDomain,
  protectUrl
) => {
  const params = {
    FunctionName: lambdaName,
    Role: roleArn,
    Handler: "index.handler",
    Runtime: "nodejs12.x",
    Description: "producerLambda",
    Environment: {
      Variables: {
        SQS_URL: sqsUrl,
        REGION: region,
        S3_OBJECT_ROOT_DOMAIN: s3ObjectRootDomain,
        WAITROOM_ON: "true",
        PROTECT_URL: protectUrl
      },
    },
    Code: { ZipFile: code },
  };

  const command = new CreateFunctionCommand(params);

  try {
    const { FunctionArn } = await lambda.send(command);
    logger.debugSuccess(`Successfully created PreLambda: ${FunctionArn}`);
    return FunctionArn;
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Adds a permission so that the API Gateway can trigger the Lambda. 
 * @param {LambdaClient} lambda Looks like `new LambdaClient({ region })`
 * @param {String} lambdaName A constant `beekeeper-${PROFILE_NAME}-prelambda`
 */
const addLambdaPermission = async (lambda, lambdaName) => {
  let params = {
    Action: "lambda:InvokeFunction",
    FunctionName: lambdaName,
    Principal: "apigateway.amazonaws.com",
    StatementId: `${Math.random().toString(16).substring(2)}`,
  };
  const command = new AddPermissionCommand(params);

  try {
    await lambda.send(command);
    logger.debugSuccess(`Successfully added API Gateway permission to Lambda.`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * 
 * @param {String} region A constant destructured from the CLI user's answers in `deploy.js`. Like "us-east-2".
 * @param {String} lambdaName A constant `beekeeper-${PROFILE_NAME}-prelambda`
 * @param {String} sqsUrl URL of the sqs queue returned by `deploySQS.js`
 * @param {String} asset This is the path of the index.js.zip file holding the code for this Lambda.
 * @param {String} roleArn Amazon resource number for the kitchen sink role returned by `createRole()`
 * @param {String} s3ObjectRootDomain Constant `https://${bucketName}.s3.${region}.amazonaws.com`;
 * @param {String} protectUrl A constant destructured from the CLI user's answers in `deploy.js`. Like "https://www.example.com".
 * @returns {String} Returns the ARN of this pre queue Lambda
 */
module.exports = async (
  region,
  lambdaName,
  sqsUrl,
  asset,
  roleArn,
  s3ObjectRootDomain,
  protectUrl
) => {
  let code = fs.readFileSync(asset);

  // Create a Lambda client service object
  const lambda = new LambdaClient({ region });

  // Create pre lambda
  const lambdaArn = await createPreLambda(
    lambda,
    lambdaName,
    sqsUrl,
    code,
    roleArn,
    region,
    s3ObjectRootDomain,
    protectUrl
  );

  // Add API Gateway Permission (Solution to AWS Bug)
  await addLambdaPermission(lambda, lambdaName);

  return lambdaArn;
};
