/**
 * Exports an async function that tears down the API Gateway.
 * @module destroyApiGateway
 */
const {
  APIGatewayClient,
  DeleteRestApiCommand,
  GetRestApisCommand,
} = require("@aws-sdk/client-api-gateway");
const logger = require("../../utils/logger")("dev");

/**
 * Retrieves the API Gateway ID
 * @param {APIGatewayClient} apiGateway This is the API Gateway client.
 * @param {String} apiName This is the name of the API Gateway
 * @returns {Number} This is the API Gateway ID
 * @throws Will throw an error if API Gateway fails to execute its command
 */
const getApiId = async (apiGateway, apiName) => {
  const command = new GetRestApisCommand({});

  try {
    const { items } = await apiGateway.send(command);
    const { id } = items.find((gate) => gate.name === apiName);
    logger.debugSuccess(`Successfully found id of api gateway: ${apiName}`);
    return id;
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Tear down the API Gateway
 * @param {APIGatewayClient} apiGateway This is the API Gateway client.
 * @param {String} restApiId This is the API Gateway ID.
 * @throws Will throw an error if API Gateway fails to execute its command
 */
const destroyRestApi = async (apiGateway, restApiId) => {
  const params = { restApiId };

  const command = new DeleteRestApiCommand(params);

  try {
    await apiGateway.send(command);
    logger.debugSuccess(`Successfully deleted api gateway: ${restApiId}`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Exports destroyApiGateway
 * @param {String} region This is the region of where this AWS service is deployed.
 * @param {String} apiName This is the name of the API Gateway
 */
module.exports = async (region, apiName) => {
  const apiGateway = new APIGatewayClient({ region });

  const restApiId = await getApiId(apiGateway, apiName);

  await destroyRestApi(apiGateway, restApiId);
};
