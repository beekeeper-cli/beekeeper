const {
  APIGatewayClient,
  CreateRestApiCommand,
  GetResourcesCommand,
  CreateResourceCommand,
  PutMethodCommand,
  PutIntegrationCommand,
  PutIntegrationResponseCommand,
  PutMethodResponseCommand,
} = require("@aws-sdk/client-api-gateway");
const logger = require("../../utils/logger")("dev");

const createApiGateway = async (apiGateway, apiGatewayName) => {
  const params = {
    name: apiGatewayName,
    description: "SealBuzz API",
    endpointConfiguration: { types: ["REGIONAL"] },
  };

  const command = new CreateRestApiCommand(params);

  try {
    const { id: restApiId } = await apiGateway.send(command);
    logger.debugSuccess(
      `Successfully created API Gateway: ${apiGatewayName}, id:${restApiId}`
    );
    return restApiId;
  } catch (err) {
    logger.debugError("Error", err);
  }
};

const getResources = async (apiGateway, restApiId, apiGatewayName) => {
  const params = {
    restApiId,
  };

  const command = new GetResourcesCommand(params);

  try {
    const result = await apiGateway.send(command);
    const { id: resourceParentId } = result.items[0];
    logger.debugSuccess(
      `Successfully retrieved API root resource ('/') for: ${apiGatewayName}`
    );
    return resourceParentId;
  } catch (err) {
    logger.debugError("Error", err);
  }
};

const createResource = async (
  apiGateway,
  restApiId,
  resourceParentId,
  resourceName
) => {
  const params = {
    restApiId,
    parentId: resourceParentId,
    pathPart: resourceName,
  };

  const command = new CreateResourceCommand(params);

  try {
    const { id: resourceId } = await apiGateway.send(command);
    logger.debugSuccess(`Successfully retrieved resource id for: ${resourceName}`);
    return resourceId;
  } catch (err) {
    logger.debugError("Error", err);
  }
};

const mainPutMethodRequest = async (
  apiGateway,
  restApiId,
  mainResourceId,
  mainResourceName
) => {
  const params = {
    restApiId,
    httpMethod: "GET",
    resourceId: mainResourceId,
    authorizationType: "NONE",
  };

  const command = new PutMethodCommand(params);

  try {
    await apiGateway.send(command);
    logger.debugSuccess(
      `Successfully set request method for resource: ${mainResourceName}`
    );
  } catch (err) {
    logger.debugError("Error", err);
  }
};

const setIntegrationRequest = async (
  apiGateway,
  mainResourceId,
  restApiId,
  lambdaUri,
  mainResourceName
) => {
  const params = {
    httpMethod: "GET",
    resourceId: mainResourceId,
    restApiId,
    type: "AWS_PROXY",
    contentHandling: "CONVERT_TO_TEXT",
    passthroughBehavior: "WHEN_NO_MATCH",
    timeoutInMillis: 29000,
    integrationHttpMethod: "POST",
    uri: lambdaUri,
  };

  const command = new PutIntegrationCommand(params);

  try {
    await apiGateway.send(command);
    logger.debugSuccess(
      `Successfully set integration request for resource: ${mainResourceName}`
    );
  } catch (err) {
    logger.debugError("Error", err);
  }
};

const setIntegrationResponse = async (
  apiGateway,
  mainResourceId,
  restApiId,
  mainResourceName
) => {
  const params = {
    httpMethod: "GET",
    resourceId: mainResourceId,
    restApiId,
    statusCode: "200",
  };

  const command = new PutIntegrationResponseCommand(params);

  try {
    await apiGateway.send(command);
    logger.debugSuccess(
      `Successfully set integration response for resource: ${mainResourceName}`
    );
  } catch (err) {
    logger.debugError("Error", err);
  }
};

const setMethodResponse = async (
  apiGateway,
  mainResourceId,
  restApiId,
  mainResourceName
) => {
  const params = {
    httpMethod: "GET",
    resourceId: mainResourceId,
    restApiId,
    statusCode: "200",
  };

  const command = new PutMethodResponseCommand(params);

  try {
    await apiGateway.send(command);
    logger.debugSuccess(
      `Successfully set method response for resource: ${mainResourceName}`
    );
  } catch (err) {
    logger.debugError("Error", err);
  }
};

module.exports = async (region, apiGatewayName, preLambdaArn, stageName) => {
  // Create an API Gateway client service object
  const apiGateway = new APIGatewayClient({ region });

  // Create API Gateway
  const restApiId = await createApiGateway(apiGateway, apiGatewayName);

  // Get root resource ('/')
  const resourceParentId = await getResources(
    apiGateway,
    restApiId,
    apiGatewayName
  );

  // Resource triggers lambda
  const mainResourceName = "sealbuzz";
  const mainResourceId = await createResource(
    apiGateway,
    restApiId,
    resourceParentId,
    mainResourceName
  );

  // Setup Method Request
  await mainPutMethodRequest(
    apiGateway,
    restApiId,
    mainResourceId,
    mainResourceName
  );

  // Setup Integration Request
  let preLambdaUri = `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${preLambdaArn}/invocations`;

  await setIntegrationRequest(
    apiGateway,
    mainResourceId,
    restApiId,
    preLambdaUri,
    mainResourceName
  );

  // Setup Integration Response
  await setIntegrationResponse(
    apiGateway,
    mainResourceId,
    restApiId,
    mainResourceName
  );

  // Setup Method Response
  await setMethodResponse(
    apiGateway,
    mainResourceId,
    restApiId,
    mainResourceName
  );

  return {
    restApiId,
    stageSealBuzzUrl: `https://${restApiId}.execute-api.${region}.amazonaws.com/${stageName}/${mainResourceName}`,
  };
};
