/**
 * Exports an async function that deploys the DynamoDB database
 * @module deployPollingRoute
 */
const {
  APIGatewayClient,
  GetResourcesCommand,
  CreateResourceCommand,
  PutMethodCommand,
  PutIntegrationCommand,
  PutIntegrationResponseCommand,
  PutMethodResponseCommand,
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
 * Creates a subresource "/polling" of root
 * @param {APIGatewayClient} apiGateway Looks like `new APIGatewayClient({ region })`
 * @param {String} restApiId The string returned from `createApiGateway()`
 * @param {String} resourceParentId The id of the root resource returned from `getResources();`
 * @param {String} resourceName A constant "polling"
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
 * Our "/polling" endpoint has one method it handles, a GET request. This function creates it and customizes a header for the request named `cookie` with a placeholder value of false at creation time. 
 * @param {APIGatewayClient} apiGateway Looks like new `APIGatewayClient({ region })`
 * @param {String} restApiId The string returned from `createApiGateway()`
 * @param {String} pollingResourceId Id referring to the "/polling" resource returned from `createResource()`
 * @param {String} pollingResourceName A constant "polling"
 */
const putMethodRequest = async (
  apiGateway,
  restApiId,
  pollingResourceId,
  pollingResourceName
) => {
  const params = {
    restApiId,
    httpMethod: "GET",
    resourceId: pollingResourceId,
    authorizationType: "NONE",
    requestParameters: {
      "method.request.header.cookie": false,
    },
  };

  const command = new PutMethodCommand(params);

  try {
    await apiGateway.send(command);
    logger.debugSuccess(
      `Successfully set request method for resource: ${pollingResourceName}`
    );
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Instead of triggering a Lambda, this resource uses a template to access the `cookie` value off the request headers and then performs a direct query of the DB to see if the token exists.
 * @param {APIGatewayClient} apiGateway Looks like `new APIGatewayClient({ region })`
 * @param {String} pollingResourceId Id referring to the the "/polling" resource we created.
 * @param {String} restApiId The string returned from `createApiGateway()`
 * @param {String} dynamoDbUri Uri that references the DynamoDB
 * @param {String} pollingResourceName Constant is "polling"
 * @param {String} roleArn Amazon resource number for the kitchen sink role returned by `createRole()`
 * @param {String} dynamoName Constant initialized in `deploy.js`, looks like `beekeeper-${PROFILE_NAME}-ddb`
 */
const setIntegrationRequest = async (
  apiGateway,
  pollingResourceId,
  restApiId,
  dynamoDbUri,
  pollingResourceName,
  roleArn,
  dynamoName
) => {
  const params = {
    httpMethod: "GET",
    resourceId: pollingResourceId,
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
      `Successfully set integration request for resource: ${pollingResourceName}`
    );
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
* Creates the Integration Response stage of the API Gateway and makes customizations. We add specific headers to the response to allow CORS and since credentials are being sent with the original request to this resource, we have to specifically interpolate the URL we want the browswer to allow for Access-Control-Allow-Origin, in this case the waiting room URL. We also use a template to take the response from the DB and construct an object to send back to the client with two properties "allow" that will be a boolean and "protectUrl" that will be the final destination to redirect users to.
 * @param {APIGatewayClient} apiGateway Looks like `new APIGatewayClient({ region })`
 * @param {String} pollingResourceId Id referring to the the "/polling" resource we created.
 * @param {String} restApiId The string returned from `createApiGateway()`
 * @param {String} pollingResourceName Constant is "polling"
 * @param {String} bucketObjectTld A public URL where the object in the S3 bucket is located, i.e. the waiting room URL.
 * @param {String} protectUrl A constant destructured from the CLI user's answers in `deploy.js`. Like "https://www.example.com".
 */
const setIntegrationResponse = async (
  apiGateway,
  pollingResourceId,
  restApiId,
  pollingResourceName,
  bucketObjectTld,
  protectUrl
) => {
  const params = {
    httpMethod: "GET",
    resourceId: pollingResourceId,
    restApiId,
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Credentials": "'true'",
      "method.response.header.Access-Control-Allow-Headers": "'*'",
      "method.response.header.Access-Control-Allow-Methods": "'*'",
      "method.response.header.Access-Control-Allow-Origin": `'${bucketObjectTld}'`,
    },
    responseTemplates: {
      "application/json":
        `#set($inputRoot = $input.path(\'$\'))\n#if($inputRoot.Count > 0)\n{\n"allow": $inputRoot.Items[0].allow.BOOL,\n  "origin": "${protectUrl}"\n}\n#else\n{\n"allow": false\n}\n#end`,
    },
  };

  const command = new PutIntegrationResponseCommand(params);

  try {
    await apiGateway.send(command);
    logger.debugSuccess(
      `Successfully set integration response for resource: ${pollingResourceName}`
    );
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
* Creates the Method Response stage. Of note is the creation of headers for CORS purposes. The values start out as false when creating them, but are changed in `setIntegrationResponse()`
 * @param {APIGatewayClient} apiGateway Looks like `new APIGatewayClient({ region })`
 * @param {String} pollingResourceId Id referring to the the "/polling" resource we created.
 * @param {String} restApiId The string returned from `createApiGateway()`
 * @param {String} pollingResourceName Constant is "polling"
 */
const setMethodResponse = async (
  apiGateway,
  pollingResourceId,
  restApiId,
  pollingResourceName
) => {
  const params = {
    httpMethod: "GET",
    resourceId: pollingResourceId,
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
      `Successfully set method response for resource: ${pollingResourceName}`
    );
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Exports `deployPollingRoute()`
 * @param {String} restApiId The id referring to the API Gateway
 * @param {String} region A constant destructured from the CLI user's answers in `deploy.js`. Like "us-east-2".
 * @param {String} apiGatewayName A constant created in `deploy.js`, is `beekeeper-${PROFILE_NAME}-apigateway`
 * @param {String} dynamoName Constant initialized in `deploy.js`, looks like `beekeeper-${PROFILE_NAME}-ddb`
 * @param {String} roleArn Amazon resource number for the kitchen sink role returned by `createRole()`
 * @param {String} bucketObjectTld A public URL where the object in the S3 bucket is located, i.e. the waiting room URL.
 * @param {String} stageName A constant "prod"
 * @param {String} protectUrl A constant destructured from the CLI user's answers in `deploy.js`. Like "https://www.example.com".
 * @returns {String} A URL that the waiting room can poll to see if the user's token is in the DB `https://${restApiId}.execute-api.${region}.amazonaws.com/${stageName}/${pollingResourceName}`;
 */
module.exports = async (
  restApiId,
  region,
  apiGatewayName,
  dynamoName,
  roleArn,
  bucketObjectTld,
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

  // Create Polling resource
  const pollingResourceName = "polling";
  const pollingResourceId = await createResource(
    apiGateway,
    restApiId,
    resourceParentId,
    pollingResourceName
  );

  // Setup Method Request
  await putMethodRequest(
    apiGateway,
    restApiId,
    pollingResourceId,
    pollingResourceName
  );

  // Setup Integration Request
  const dynamoDbUri = `arn:aws:apigateway:${region}:dynamodb:action/Query`;
  await setIntegrationRequest(
    apiGateway,
    pollingResourceId,
    restApiId,
    dynamoDbUri,
    pollingResourceName,
    roleArn,
    dynamoName
  );

  // Setup Method Response
  await setMethodResponse(
    apiGateway,
    pollingResourceId,
    restApiId,
    pollingResourceName
  );

  // Setup Integration Response
  await setIntegrationResponse(
    apiGateway,
    pollingResourceId,
    restApiId,
    pollingResourceName,
    bucketObjectTld,
    protectUrl
  );

  // Stage polling URL
  return `https://${restApiId}.execute-api.${region}.amazonaws.com/${stageName}/${pollingResourceName}`;
};
