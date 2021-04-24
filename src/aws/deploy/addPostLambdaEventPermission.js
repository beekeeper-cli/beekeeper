const {
  LambdaClient,
  AddPermissionCommand,
} = require("@aws-sdk/client-lambda");
const logger = require("../../utils/logger")("deploy");

const addLambdaPermission = async (lambda, lambdaName, sourceArn) => {
  let params = {
    Action: "lambda:InvokeFunction",
    FunctionName: lambdaName,
    Principal: "events.amazonaws.com",
    SourceArn: sourceArn,
    StatementId: `${Math.random().toString(16).substring(2)}`,
  };
  const command = new AddPermissionCommand(params);

  try {
    await lambda.send(command);
    logger.debug(`Successfully added permission to postLambda.`);
  } catch (err) {
    logger.debugError("Error", err);
  }
};

module.exports = async (
  region,
  lambdaName,
  sourceArn
) => {

  // Create a Lambda client service object
  const lambda = new LambdaClient({ region });

  // Add API Gateway Permission (Solution to AWS Bug)
  await addLambdaPermission(lambda, lambdaName, sourceArn);
};
