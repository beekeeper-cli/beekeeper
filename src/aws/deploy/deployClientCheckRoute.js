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
