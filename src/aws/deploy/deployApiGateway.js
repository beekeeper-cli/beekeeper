const { ApiGatewayV2Client, CreateApiCommand } = require("@aws-sdk/client-apigatewayv2");
const logger = require('../../utils/logger')('commands:api_gateway');

const createApiGateway = async (apiGateway, apiGatewayName) => {
  const params = {
    Name: apiGatewayName,
    ProtocolType: "HTTP"
  }
  const command = new CreateApiCommand(params);

  try {
    await apiGateway.send(command);
    logger.log(`Successfully created API Gateway: ${apiGatewayName}`);
  } catch (err) {
    logger.log("Error", err);
  };
}

module.exports = async (region, apiGatewayName) => {
  // Create an API Gateway client service object
  const apiGateway = new ApiGatewayV2Client({ region });

  // Create API Gateway
  await createApiGateway(apiGateway, apiGatewayName);
};
