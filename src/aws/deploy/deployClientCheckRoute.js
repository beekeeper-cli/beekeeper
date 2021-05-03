/**
 * Exports an async function that creates the "/client" resource with a GET method on it. This is the endpoint our users can hit to verify that one of their users hasn't skipped the waiting room. That request from the final destination to here will have the cookie, which has the token. This endpoint takes that token and checks the DB to see if it is there.
 * @module deployClientCheckRoute
 */

const {
  APIGatewayClient,
  GetResourcesCommand,
  CreateResourceCommand,
  PutMethodCommand,
  PutIntegrationCommand,
  PutIntegrationResponseCommand,
  PutMethodResponseCommand,
  CreateDeploymentCommand,
} = require("@aws-sdk/client-api-gateway");
const logger = require("../../utils/logger")("dev");

/**
 * Function which gets the id of the root resource "/" of the API Gateway originally created in `deployApiGateway()`
 * @param {APIGatewayClient} apiGateway Looks like `new APIGatewayClient({ region });`
 * @param {String} restApiId ID refering to the API Gateway. Was returned from `deployApiGateway()`
 * @param {String} apiGatewayName A constant from `deploy.js`, looks like `beekeeper-${PROFILE_NAME}-apigateway`
 * @returns {String} An id which refers to the root resource of the API Gateway, i.e. "/"
 */
const getResources = async (apiGateway, restApiId, apiGatewayName) => {
  const params = {
    restApiId,
  };

  const command = new GetResourcesCommand(params);

  try {
    const result = await apiGateway.send(command);
    const { id: resourceParentId } = result.items.find(
      (item) => item.path === "/"
    );
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
 * Creates a subresource "/client" of root
 * @param {APIGatewayClient} apiGateway Looks like `new APIGatewayClient({ region })`
 * @param {String} restApiId The string returned from `createApiGateway()`
 * @param {String} resourceParentId The id of the root resource returned from `getResources();`
 * @param {String} resourceName A constant "client"
 * @returns {String} A resourceId referring to this new resource
 */
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
    throw new Error(err);
  }
};

/**
 * Our "/client" endpoint has one method it handles, a GET request. This function creates it and customizes a header for the request named `cookie` so that it can be grabbed off the request at the next stage.
 * @param {APIGatewayClient} apiGateway Looks like new `APIGatewayClient({ region })`
 * @param {String} restApiId The string returned from `createApiGateway()`
 * @param {String} clientCheckResourceId Id referring to the "/client" resource returned from `createResource()`
 * @param {String} clientCheckResourceName A constant "client"
 */
const putMethodRequest = async (
  apiGateway,
  restApiId,
  clientCheckResourceId,
  clientCheckResourceName
) => {
  const params = {
    restApiId,
    httpMethod: "GET",
    resourceId: clientCheckResourceId,
    authorizationType: "NONE",
    requestParameters: {
      "method.request.header.cookie": false,
    },
  };

  const command = new PutMethodCommand(params);

  try {
    await apiGateway.send(command);
    logger.debugSuccess(
      `Successfully set request method for resource: ${clientCheckResourceName}`
    );
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Instead of triggering a Lambda, this resource uses a template to access the `cookie` value off the request headers and then performs a direct query of the DB to see if the token exists.
 * @param {APIGatewayClient} apiGateway Looks like `new APIGatewayClient({ region })`
 * @param {String} clientCheckResourceId Id referring to the the "/client" resource we created.
 * @param {String} restApiId The string returned from `createApiGateway()`
 * @param {String} dynamoDbUri Uri that references the DynamoDB
 * @param {String} clientCheckResourceName Constant is "client"
 * @param {String} roleArn Amazon resource number for the kitchen sink role returned by `createRole()`
 * @param {String} dynamoName Constant initialized in `deploy.js`, looks like `beekeeper-${PROFILE_NAME}-ddb`
 */
const setIntegrationRequest = async (
  apiGateway,
  clientCheckResourceId,
  restApiId,
  dynamoDbUri,
  clientCheckResourceName,
  roleArn,
  dynamoName
) => {
  const params = {
    httpMethod: "GET",
    resourceId: clientCheckResourceId,
    restApiId,
    type: "AWS",
    integrationHttpMethod: "POST",
    contentHandling: "CONVERT_TO_TEXT",
    passthroughBehavior: "WHEN_NO_TEMPLATES",
    credentials: roleArn,
    timeoutInMillis: 29000,
    uri: dynamoDbUri,
    requestTemplates: {
      "application/json": `#set ($string = $input.params('cookie'))\n#set ($s = $string.split(\"=\"))\n{\n  \"TableName\": \"${dynamoName}\",\n  \"KeyConditionExpression\": \"usertoken = :v1\",\n  \"ExpressionAttributeValues\": {\n      \":v1\": {\n          \"S\": \"$s.get(1)\"\n      }\n  }\n}`,
    },
  };

  const command = new PutIntegrationCommand(params);

  try {
    await apiGateway.send(command);
    logger.debugSuccess(
      `Successfully set integration request for resource: ${clientCheckResourceName}`
    );
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Creates the Integration Response stage of the API Gateway and makes customizations. We add specific headers to the response to allow CORS and since credentials are being sent with the original request to this resource, we have to specifically interpolate the URL we want the browswer to allow for Access-Control-Allow-Origin. We also use a template to take the response from the DB and construct an object to send back to the client with one property "allow" that will be a boolean.
 * @param {APIGatewayClient} apiGateway Looks like `new APIGatewayClient({ region })`
 * @param {String} clientCheckResourceId Id referring to the the "/client" resource we created.
 * @param {String} restApiId The string returned from `createApiGateway()`
 * @param {String} clientCheckResourceName Constant is "client"
 * @param {String} protectUrl A constant destructured from the CLI user's answers in `deploy.js`. Like "https://www.example.com".
 */
const setIntegrationResponse = async (
  apiGateway,
  clientCheckResourceId,
  restApiId,
  clientCheckResourceName,
  protectUrl
) => {
  const params = {
    httpMethod: "GET",
    resourceId: clientCheckResourceId,
    restApiId,
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Credentials": "'true'",
      "method.response.header.Access-Control-Allow-Headers": "'*'",
      "method.response.header.Access-Control-Allow-Methods": "'*'",
      "method.response.header.Access-Control-Allow-Origin": `'${protectUrl}'`,
    },
    responseTemplates: {
      "application/json":
        `#set($inputRoot = $input.path(\'$\'))\n#if($inputRoot.Count > 0)\n{\n"allow": $inputRoot.Items[0].allow.BOOL\n}\n#else\n{\n"allow": false\n}\n#end`,
    },
  };

  const command = new PutIntegrationResponseCommand(params);

  try {
    await apiGateway.send(command);
    logger.debugSuccess(
      `Successfully set integration response for resource: ${clientCheckResourceName}`
    );
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Creates the Method Response stage. Of note is the creation of headers for CORS purposes. The values start out as false when creating them, but are changed in `setIntegrationResponse()`
 * @param {APIGatewayClient} apiGateway Looks like `new APIGatewayClient({ region })`
 * @param {String} clientCheckResourceId Id referring to the the "/client" resource we created.
 * @param {String} restApiId The string returned from `createApiGateway()`
 * @param {String} clientCheckResourceName Constant is "client"
 */
const setMethodResponse = async (
  apiGateway,
  clientCheckResourceId,
  restApiId,
  clientCheckResourceName
) => {
  const params = {
    httpMethod: "GET",
    resourceId: clientCheckResourceId,
    restApiId,
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Credentials": false,
      "method.response.header.Access-Control-Allow-Headers": false,
      "method.response.header.Access-Control-Allow-Methods": false,
      "method.response.header.Access-Control-Allow-Origin": false,
    },
  };

  const command = new PutMethodResponseCommand(params);

  try {
    await apiGateway.send(command);
    logger.debugSuccess(
      `Successfully set method response for resource: ${clientCheckResourceName}`
    );
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Now that the API Gateway was created and all resources and their methods are added, we deploy the API Gateway.
 * @param {APIGatewayClient} apiGateway Looks like `new APIGatewayClient({ region })`
 * @param {String} restApiId The string returned from `createApiGateway()`
 * @param {String} stageName A constant "prod"
 */
const deployResource = async (apiGateway, restApiId, stageName) => {
  const params = {
    restApiId,
    stageDescription: "production client check endpoint",
    stageName,
  };

  const command = new CreateDeploymentCommand(params);

  try {
    await apiGateway.send(command);
    logger.debugSuccess(`Successfully deployed resource: ${restApiId}`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Exports `deployClientCheckRoute()`
 * @param {String} restApiId The id referring to the API Gateway
 * @param {String} region A constant destructured from the CLI user's answers in `deploy.js`. Like "us-east-2".
 * @param {String} apiGatewayName A constant created in `deploy.js`, is `beekeeper-${PROFILE_NAME}-apigateway`
 * @param {String} dynamoName Constant initialized in `deploy.js`, looks like `beekeeper-${PROFILE_NAME}-ddb`
 * @param {String} roleArn Amazon resource number for the kitchen sink role returned by `createRole()`
 * @param {String} stageName A constant "prod"
 * @param {String} protectUrl A constant destructured from the CLI user's answers in `deploy.js`. Like "https://www.example.com".
 * @returns {String} A URL that the final destination can use to check that a given user didn't skip the waiting room, looks like `https://${restApiId}.execute-api.${region}.amazonaws.com/${stageName}/${clientCheckResourceName}`;
 */
module.exports = async (
  restApiId,
  region,
  apiGatewayName,
  dynamoName,
  roleArn,
  stageName,
  protectUrl
) => {
  // Create an API Gateway client service object
  const apiGateway = new APIGatewayClient({ region });

  // Get root resource ('/')
  const resourceParentId = await getResources(
    apiGateway,
    restApiId,
    apiGatewayName
  );

  // Create Client Check Resource
  const clientCheckResourceName = "client";
  const clientCheckResourceId = await createResource(
    apiGateway,
    restApiId,
    resourceParentId,
    clientCheckResourceName
  );

  // Setup Method Request
  await putMethodRequest(
    apiGateway,
    restApiId,
    clientCheckResourceId,
    clientCheckResourceName
  );

  // Setup Integration Request
  const dynamoDbUri = `arn:aws:apigateway:${region}:dynamodb:action/Query`;
  await setIntegrationRequest(
    apiGateway,
    clientCheckResourceId,
    restApiId,
    dynamoDbUri,
    clientCheckResourceName,
    roleArn,
    dynamoName
  );

  // Setup Method Response
  await setMethodResponse(
    apiGateway,
    clientCheckResourceId,
    restApiId,
    clientCheckResourceName
  );

  // Setup Integration Response
  await setIntegrationResponse(
    apiGateway,
    clientCheckResourceId,
    restApiId,
    clientCheckResourceName,
    protectUrl
  );

  // stage resource and deploy
  await deployResource(apiGateway, restApiId, stageName);

  // Client Check URL
  return `https://${restApiId}.execute-api.${region}.amazonaws.com/${stageName}/${clientCheckResourceName}`;
};
