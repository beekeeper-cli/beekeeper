
 const {
  LambdaClient,
  CreateFunctionCommand,
  AddPermissionCommand,
} = require("@aws-sdk/client-lambda");
const logger = require("../../utils/logger")("dev");
const fs = require("fs");


const createPreLambda = async (
  lambda,
  lambdaName,
  sqsUrl,
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
    Description: "producerLambda",
    Environment: {
      Variables: {
        TABLE_NAME: sqsUrl,
        REGION: region,
        END_POINT: protectUrl,
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
