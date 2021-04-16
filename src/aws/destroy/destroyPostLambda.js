const { LambdaClient, DeleteFunctionCommand } = require("@aws-sdk/client-lambda");
const logger = require("../../utils/logger")("commands:destroyPostLambda");

const destroyPostLambda = async (lambda, lambdaName) => {
  const params = {
    FunctionName: lambdaName,
  };
  const command = new DeleteFunctionCommand(params);

  try {
    await lambda.send(command);
    logger.log(`Successfully deleted Post Lambda: ${lambdaName}`);
  } catch (err) {
    logger.log("Error", err);
  }
}

module.exports = async (region, lambdaName) => {
  // Create an Lambda client service object
  const lambda = new LambdaClient({ region });

  // Destroy Post Lambda
  await destroyPostLambda(lambda, lambdaName);
};
