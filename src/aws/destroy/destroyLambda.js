const { LambdaClient, DeleteFunctionCommand } = require("@aws-sdk/client-lambda");
const logger = require("../../utils/logger")("dev");

const destroyLambda = async (lambda, lambdaName) => {
  const params = {
    FunctionName: lambdaName,
  };
  const command = new DeleteFunctionCommand(params);

  try {
    await lambda.send(command);
    logger.debugSuccess(`Successfully deleted Lambda: ${lambdaName}`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
}

module.exports = async (region, lambdaName) => {
  // Create a Lambda client service object
  const lambda = new LambdaClient({ region });

  // Destroy Lambda
  await destroyLambda(lambda, lambdaName);
};
