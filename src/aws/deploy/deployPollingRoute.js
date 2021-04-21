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
const logger = require("../../utils/logger")("commands:deployPollingRoute");

const getResources = async (apiGateway, restApiId, apiGatewayName) => {
  const params = {
    restApiId,
  };

  const command = new GetResourcesCommand(params);

  try {
    const result = await apiGateway.send(command);
    const { id: resourceParentId } = result.items[0];
    logger.log(
      `Successfully retrieved API root resource ('/') for: ${apiGatewayName}`
    );
    return resourceParentId;
  } catch (err) {
    logger.warning("Error", err);
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
    logger.log(`Successfully retrieved resource id for: ${resourceName}`);
    return resourceId;
  } catch (err) {
    logger.warning("Error", err);
  }
};

const putMethodRequest = async (apiGateway, restApiId, pollingResourceId, pollingResourceName) => {
  const params = {
    restApiId,
    httpMethod: "GET",
    resourceId: pollingResourceId,
    authorizationType: "NONE",
    requestParameters: {
      "method.request.header.cookie": false
    }
  };

  const command = new PutMethodCommand(params);

  try {
    await apiGateway.send(command);
    logger.log(`Successfully set request method for resource: ${pollingResourceName}`);
  } catch (err) {
    logger.warning("Error", err);
  }
}

const setIntegrationRequest = async (apiGateway, pollingResourceId, restApiId, dynamoDbUri, pollingResourceName, roleArn) => {
  const params = {
    httpMethod: "GET",
    resourceId: pollingResourceId,
    restApiId,
    type: "AWS",
    integrationHttpMethod: "POST",
    contentHandling: 'CONVERT_TO_TEXT',
    passthroughBehavior: 'WHEN_NO_TEMPLATES',
    credentials: roleArn,
    timeoutInMillis: 29000,
    uri: dynamoDbUri,
    requestTemplates: {
      "application/json": `#set ($string = \"$input.params('cookie')\")\n#set ($s = $string.split(\"=\"))\n{\n  \"TableName\": \"waiting_room\",\n  \"KeyConditionExpression\": \"usertoken = :v1\",\n  \"ExpressionAttributeValues\": {\n      \":v1\": {\n          \"S\": \"$s.get(1)\"\n      }\n  }\n}`
    }
  };

  const command = new PutIntegrationCommand(params);

  try {
    await apiGateway.send(command);
    logger.log(`Successfully set integration request for resource: ${pollingResourceName}`);
  } catch (err) {
    logger.warning("Error", err);
  }
}

const setIntegrationResponse = async (apiGateway, pollingResourceId, restApiId, pollingResourceName, bucketUrl) => {
  const params = { 
    httpMethod: "GET",
    resourceId: pollingResourceId, 
    restApiId, 
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Credentials": "'true'",
      "method.response.header.Access-Control-Allow-Headers": "'*'",
      "method.response.header.Access-Control-Allow-Methods": "'*'",
      "method.response.header.Access-Control-Allow-Origin": `'${bucketUrl}'`
    },
    responseTemplates: {
      "application/json": "#set($inputRoot = $input.path('$'))\n#if($inputRoot.Count == 0)\n{\n\"allow\": false\n}\n#else\n{\n  \"allow\": true,\n  \"origin\": \"https://www.launchschool.com/capstone\"\n}\n#end"
    }
  }

  const command = new PutIntegrationResponseCommand(params);

  try {
    await apiGateway.send(command);
    logger.log(`Successfully set integration response for resource: ${pollingResourceName}`);
  } catch (err) {
    logger.warning("Error", err);
  }
}

const setMethodResponse = async (apiGateway, pollingResourceId, restApiId, pollingResourceName) => {
  const params = {
    httpMethod: "GET",
    resourceId: pollingResourceId,
    restApiId,
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Credentials": false,
      "method.response.header.Access-Control-Allow-Headers": false,
      "method.response.header.Access-Control-Allow-Methods": false,
      "method.response.header.Access-Control-Allow-Origin": false
    },
  }

  // might need a model 
  // responseModels: {
  //   "application/json": "Empty"
  // }

  const command = new PutMethodResponseCommand(params);

  try {
    await apiGateway.send(command);
    logger.log(`Successfully set method response for resource: ${pollingResourceName}`);
  } catch (err) {
    logger.warning("Error", err);
  }
}

const deployResource = async (apiGateway, restApiId) => {
  const params = { 
    restApiId,
    stageDescription: 'production sealbuzz waitroom',
    stageName: 'sealbuzz-production'
  };

  const command = new CreateDeploymentCommand(params);

  try {
    await apiGateway.send(command);
    logger.log(`Successfully deployed resource: ${restApiId}`);
  } catch (err) {
    logger.warning("Error", err);
  }
};

module.exports = async (restApiId, region, apiGatewayName, dynamoDbArn, roleArn, bucketUrl) => {
  // // Create an API Gateway client service object
  const apiGateway = new APIGatewayClient({ region });

  // // Create API Gateway
  // const restApiId = await createApiGateway(apiGateway, apiGatewayName);

  // Get root resource ('/')
  const resourceParentId = await getResources(apiGateway, restApiId, apiGatewayName);

  // Finishing pollingRoute
  const pollingResourceName = "polling";
  const pollingResourceId = await createResource(
    apiGateway,
    restApiId,
    resourceParentId,
    pollingResourceName
  );

  // Setup Method Request
  await putMethodRequest(apiGateway, restApiId, pollingResourceId, pollingResourceName)

  // Setup Integration Request
  const dynamoDbUri = `arn:aws:apigateway:${region}:dynamodb:action/Query/${dynamoDbArn}`;
  await setIntegrationRequest(apiGateway, pollingResourceId, restApiId, dynamoDbUri, pollingResourceName, roleArn)

  // Setup Method Response
  await setMethodResponse(apiGateway, pollingResourceId, restApiId, pollingResourceName);

  // Setup Integration Response
  await setIntegrationResponse(apiGateway, pollingResourceId, restApiId, pollingResourceName, bucketUrl);

  // stage resource and deploy
  await deployResource(apiGateway, restApiId);

  // need to return the url from our gateway
};
