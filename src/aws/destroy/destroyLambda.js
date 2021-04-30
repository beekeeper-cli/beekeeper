/**
 * Exports an async function that tears down a Lambda function.
 * @module destroyLambda
 */
const { LambdaClient, DeleteFunctionCommand } = require("@aws-sdk/client-lambda");
const logger = require("../../utils/logger")("dev");

/**
 * Tears down the Lambda function
 * @param {LambdaClient} lambda This is the LambdaClient client
 * @param {String} lambdaName This is the name of the Lambda function
 * @throws Will throw an error if DynamoDB client fails to execute its command
 */
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

/**
 * Exports destroyLambda
 * @param {String} region This is the region of where this AWS service is deployed
 * @param {String} lambdaName This is the name of the Lambda function
 */
module.exports = async (region, lambdaName) => {
  const lambda = new LambdaClient({ region });

  await destroyLambda(lambda, lambdaName);
};
