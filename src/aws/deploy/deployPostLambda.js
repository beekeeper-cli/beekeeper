const { LambdaClient, CreateFunctionCommand } = require("@aws-sdk/client-lambda");
const fs = require('fs');

const createPostLambda = (lambda, lambdaName) => {
  const params = {
    FunctionName: lambdaName,
    Role: '',
    Handler: "index.handler",
    Runtime: "nodejs12.x",
    Description: "consumerLambda",
    Code: {
      
    }
  };
  const command = new CreateFunctionCommand(params);

  try {
    const data = await lambda.send(command);
    // process data.
  } catch (error) {
    // error handling.
  }
}

const injectSqsUrl = () => {

}


module.exports = async (region, lambdaName, sqsURL) => {
  // Create a Lambda client service object
  const lambda = new LambdaClient({ region });
  process.env.sqsURL = sqsURL;
  
  // Create pre lambda
  await createPostLambda(lambda, lambdaName);
};

// provisions
// cloud events
// 