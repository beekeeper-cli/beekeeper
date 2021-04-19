const { LambdaClient, CreateFunctionCommand } = require("@aws-sdk/client-lambda");
const fs = require('fs');
const path = require("path");

const createPostLambda = async (lambda, lambdaName, sqsURL, code, role, region, dynamoName) => {
  console.log(sqsURL);
  console.log(region);
  console.log(dynamoName);
  const params = {
    FunctionName: lambdaName,
    Role: role,
    Handler: "index.handler",
    Runtime: "nodejs12.x",
    Description: "consumerLambda",
    Environment: {
      Variables: {
        "SQS_URL": sqsURL,
        "REGION": region, 
        "TABLE_NAME": dynamoName,
      }
    },
    Code: { ZipFile: code }
  };

  const command = new CreateFunctionCommand(params);

  try {
    const data = await lambda.send(command);
    console.log(data);
  } catch (error) {
    console.log(error);
  }
}

module.exports = async (region, lambdaName, sqsURL, asset, role, dynamoName) => {  
  // Create a Lambda client service object
  let code = fs.readFileSync(asset);
  const lambda = new LambdaClient({ region });

  // Create post lambda
  await createPostLambda(lambda, lambdaName, sqsURL, code, role, region, dynamoName);
};

// provisions
// cloud events
// let sqsUrl = process.env.SQS_URL - put this in the function code

// InvalidParameterValueException: The role defined for the function cannot be assumed by Lambda.

