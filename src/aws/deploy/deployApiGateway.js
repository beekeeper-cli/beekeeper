/**
 * Exports an async function that deploys our REST API Gateway, as opposed to HTTP API Gateway (AWS distinctions). We add one subresource, "/beekeeper" and customize it to handle GET requests. The "/beekeeper" resource handles first time visitors. We have more resources to create but separate those concerns into other modules.
 * @module deployApiGateway
 */

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


/**
 * Creates the API Gateway and the root "/" resource. The first step of deploying an API Gateway, before you can add resources and methods to it, is to create the API Gateway itself.
 * @param {APIGatewayClient} apiGateway Looks like `new APIGatewayClient({ region });`
 * @param {String} apiGatewayName A constant from `deploy.js`, looks like `beekeeper-${PROFILE_NAME}-apigateway`
 * @returns {String} A restApiId used to refer to the API Gateway.
 */
const createApiGateway = async (apiGateway, apiGatewayName) => {
  const params = {
    name: apiGatewayName,
    description: "Beekeeper API",
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
    throw new Error(err);
  }
};

/**
 * Now we query AWS for the id of the root resource `"/"` on the API Gateway we previously created. We need this because we need to add further subresources to it.
 * @param {APIGatewayClient} apiGateway Looks like `new APIGatewayClient({ region })`
 * @param {String} restApiId The string returned from `createApiGateway()`
 * @param {String} apiGatewayName A constant from deploy.js, looks like `beekeeper-${PROFILE_NAME}-apigateway`
 * @returns {String} An id which refers to the root resource of the API Gateway, i.e. "/"
 */
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
    throw new Error(err);
  }
};

/**
 * Creates a subresource "/beekeeper" of root
 * @param {APIGatewayClient} apiGateway Looks like `new APIGatewayClient({ region })`
 * @param {String} restApiId The string returned from `createApiGateway()`
 * @param {String} resourceParentId The id of the root resource returned from `getResources();`
 * @param {String} mainResourceName A constant: "beekeeper"
 * @returns {String} A resourceId referring to this new resource
 */
const createResource = async (
  apiGateway,
  restApiId,
  resourceParentId,
  mainResourceName
) => {
  const params = {
    restApiId,
    parentId: resourceParentId,
    pathPart: mainResourceName,
  };

  const command = new CreateResourceCommand(params);

  try {
    const { id: resourceId } = await apiGateway.send(command);
    logger.debugSuccess(`Successfully retrieved resource id for: ${mainResourceName}`);
    return resourceId;
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Our "/beekeeper" endpoint has one method it handles, a GET request. This function creates it.
 * @param {APIGatewayClient} apiGateway Looks like new `APIGatewayClient({ region })`
 * @param {String} restApiId The string returned from `createApiGateway()`
 * @param {String} mainResourceId The id of the resource returned from `createResource();`
 * @param {String} mainResourceName A constant: "beekeeper"
 */
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
    throw new Error(err);
  }
};

/**
 * Crates and customizes the Integration Request stage. For us, that means triggering a Lambda and setting this stage as "AWS_PROXY", which means the incoming request will be forwarded in its entirety to the Lambda.
 * @param {APIGatewayClient} apiGateway Looks like `new APIGatewayClient({ region })`
 * @param {String} mainResourceId The id referring to the "/beekeeper" resource
 * @param {String} restApiId The string returned from `createApiGateway()`
 * @param {String} lambdaUri Something we build that refers to the Lambda we want to trigger, looks like `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${preLambdaArn}/invocations`;
 * @param {String} mainResourceName A constant: "beekeeper"
 */
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
    throw new Error(err);
  }
};

/**
 * Creates the Integration Response stage. Since the prior stage, the Integration Request stage, specified this process to be AWS_PROXY, there is nothing to customize at this Integration Response stage, just set it up. I.e. the response from the Lambda will be passed through in its entirety.
 * @param {APIGatewayClient} apiGateway Looks like `new APIGatewayClient({ region })`
 * @param {String} mainResourceId The id referring to the "/beekeeper" resource
 * @param {String} restApiId The string returned from `createApiGateway()` 
 * @param {String} mainResourceName A constant: "beekeeper"
 */
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
    throw new Error(err);
  }
};

/**
 * Creates the Method Response stage. Nothing special is customized in our case. The entire response from the Lambda is forwarded to the client as the API Gateway's response to the original request.
 * @param {APIGatewayClient} apiGateway Looks like `new APIGatewayClient({ region })`
 * @param {String} mainResourceId The id referring to the "/beekeeper" resource
 * @param {String} restApiId The string returned from `createApiGateway()` 
 * @param {String} mainResourceName A constant: "beekeeper" 
 */
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
    throw new Error(err);
  }
};

/**
 * Exports `deployApiGateway()`.
 * @param {String} region A constant destructured from the CLI user's answers in `deploy.js`. Like "us-east-2".
 * @param {String} apiGatewayName A constant created in `deploy.js`, is `beekeeper-${PROFILE_NAME}-apigateway`
 * @param {String} preLambdaArn Amazon resource name of the Lambda we need the "/beekeeper" resource of this API Gateway to trigger.
 * @param {String} stageName A constant initialized in `deploy.js`, is "prod"
 * @returns {Object} An object with two properties, the restApiId refers to the API Gateway and the stageBeekeeperUrl. The restApiId is needed by other modules to add additional resources. The stageBeekeeperUrl is the URL we build and give to our user: this is the URL they will send out to their users and which redirects to the waiting room.
 */
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
  const mainResourceName = "beekeeper";
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
    stageBeekeeperUrl: `https://${restApiId}.execute-api.${region}.amazonaws.com/${stageName}/${mainResourceName}`,
  };
};
