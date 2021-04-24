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
const logger = require("../../utils/logger")("deploy");

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
    logger.debug(
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
    logger.debug(`Successfully retrieved resource id for: ${resourceName}`);
    return resourceId;
  } catch (err) {
    logger.debugError("Error", err);
  }
};

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
    logger.debug(
      `Successfully set request method for resource: ${pollingResourceName}`
    );
  } catch (err) {
    logger.debugError("Error", err);
  }
};

const setIntegrationRequest = async (
  apiGateway,
  pollingResourceId,
  restApiId,
  dynamoDbUri,
  pollingResourceName,
  roleArn
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
      "application/json": `#set ($string = \"$input.params('cookie')\")\n#set ($s = $string.split(\"=\"))\n{\n  \"TableName\": \"waiting_room\",\n  \"KeyConditionExpression\": \"usertoken = :v1\",\n  \"ExpressionAttributeValues\": {\n      \":v1\": {\n          \"S\": \"$s.get(1)\"\n      }\n  }\n}`,
    },
  };

  const command = new PutIntegrationCommand(params);

  try {
    await apiGateway.send(command);
    logger.debug(
      `Successfully set integration request for resource: ${pollingResourceName}`
    );
  } catch (err) {
    logger.debugError("Error", err);
  }
};

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
        `#set($inputRoot = $input.path(\'$\'))\n#if($inputRoot.Count == 0)\n{\n"allow": false\n}\n#else\n{\n  "allow": true,\n  "origin": "${protectUrl}"\n}\n#end`,
    },
  };

  const command = new PutIntegrationResponseCommand(params);

  try {
    await apiGateway.send(command);
    logger.debug(
      `Successfully set integration response for resource: ${pollingResourceName}`
    );
  } catch (err) {
    logger.debugError("Error", err);
  }
};

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

  // might need a model
  // responseModels: {
  //   "application/json": "Empty"
  // }

  const command = new PutMethodResponseCommand(params);

  try {
    await apiGateway.send(command);
    logger.debug(
      `Successfully set method response for resource: ${pollingResourceName}`
    );
  } catch (err) {
    logger.debugError("Error", err);
  }
};

const deployResource = async (apiGateway, restApiId, stageName) => {
  const params = {
    restApiId,
    stageDescription: "production sealbuzz waitroom",
    stageName,
  };

  const command = new CreateDeploymentCommand(params);

  try {
    await apiGateway.send(command);
    logger.debug(`Successfully deployed resource: ${restApiId}`);
  } catch (err) {
    logger.debugError("Error", err);
  }
};

module.exports = async (
  restApiId,
  region,
  apiGatewayName,
  dynamoDbArn,
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
  const dynamoDbUri = `arn:aws:apigateway:${region}:dynamodb:action/Query/${dynamoDbArn}`;
  await setIntegrationRequest(
    apiGateway,
    pollingResourceId,
    restApiId,
    dynamoDbUri,
    pollingResourceName,
    roleArn
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

  // stage resource and deploy
  await deployResource(apiGateway, restApiId, stageName);

  // Stage polling URL
  return `https://${restApiId}.execute-api.${region}.amazonaws.com/${stageName}/${pollingResourceName}`;
};
