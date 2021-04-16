const { LambdaClient, CreateFunctionCommand } = require("@aws-sdk/client-lambda");

const createPreLambda = (lambda) => {
  const params = {
    FunctionName: "my-name",
    Role: '',
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


module.exports = async (region, lambdaName) => {
  // Create a Lambda client service object
  const lambda = new LambdaClient({ region: "REGION" });

  // Create pre lambda
  await createPreLambda(lambda);
};