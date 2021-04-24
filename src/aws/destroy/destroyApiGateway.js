const {
  APIGatewayClient,
  DeleteRestApiCommand,
  GetRestApisCommand,
} = require("@aws-sdk/client-api-gateway");
const logger = require("../../utils/logger")("dev");

const getApiId = async (apiGateway, apiName) => {
  const command = new GetRestApisCommand({});

  try {
    const { items } = await apiGateway.send(command);
    const { id } = items.find((gate) => gate.name === apiName);
    logger.debugSuccess(`Successfully found id of api gateway: ${apiName}`);
    return id;
  } catch (err) {
    logger.debugError("Error", err);
  }
};

const destroyRestApi = async (apiGateway, restApiId) => {
  const params = { restApiId };

  const command = new DeleteRestApiCommand(params);

  try {
    await apiGateway.send(command);
    logger.debugSuccess(`Successfully deleted api gateway: ${restApiId}`);
  } catch (err) {
    logger.debugError("Error", err);
  }
};

module.exports = async (region, apiName) => {
  // Create an APIGateway client service object
  const apiGateway = new APIGatewayClient({ region });

  // finds API id from list of apis
  const restApiId = await getApiId(apiGateway, apiName);
  // Destroy rest api
  await destroyRestApi(apiGateway, restApiId);
};
