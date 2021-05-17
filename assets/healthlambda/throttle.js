const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.REGION });
const FUNC_NAME = process.env.FUNC_NAME;
const lambda = new AWS.Lambda({apiVersion: '2015-03-31'});

// get current configuration
const getPostLambdaConfig = async () => {
  let config;
  const params = {
    FunctionName: FUNC_NAME
  }

  try {
    config = await lambda.getFunctionConfiguration(params).promise();
  } catch (e) {
    console.log(e);
  }
  return config;
}

// set new configuration with reduced rate
const setPostLambdaConfig = async (environment) => {
  let throttledRate = Math.ceil(Number(environment.Variables.RATE) * 0.5);
  environment.Variables.RATE = throttledRate.toString();

  const params = {
    FunctionName: FUNC_NAME,
    Environment: environment
  }

  try {
    await lambda.updateFunctionConfiguration(params).promise();
    console.log(`postLambda rate throttled to ${throttledRate}`);
  } catch (e) {
    console.log(e);
  }
}


// export function to handler
module.exports = async () => {
  const { Environment: environment } = await getPostLambdaConfig();

  setPostLambdaConfig(environment)
}