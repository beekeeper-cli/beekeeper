const { LambdaClient, CreateFunctionCommand } = require("@aws-sdk/client-lambda");
const fs = require('fs');
const path = require("path");

const createPostLambda = async (lambda, lambdaName, sqsURL, code) => {
  const params = {
    FunctionName: lambdaName,
    Role: '',
    Handler: "index.handler",
    Runtime: "nodejs12.x",
    Description: "consumerLambda",
    Environment: {
      Variables: {
        "SQS_URL": sqsURL,
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

module.exports = async (region, lambdaName, sqsURL, asset) => {
  // Create a Lambda client service object
  let code = fs.readFileSync(asset);
  const lambda = new LambdaClient({ region });

  // Create pre lambda
  await createPostLambda(lambda, lambdaName, sqsURL, code);
};

// provisions
// cloud events
// let sqsUrl = process.env.SQS_URL - put this in the function code