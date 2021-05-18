const { DeleteBackupCommand } = require("@aws-sdk/client-dynamodb");
const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.REGION });
const FUNC_NAME = process.env.FUNC_NAME;
const lambda = new AWS.Lambda({apiVersion: '2015-03-31'});
const { writeTune, getTune } = require('./dynamo');

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

const performTune = async (passed, pastTune, environment) => {
  let { initial, last } = pastTune;
  let elapsed = (Date.now() - Number(last.N)) / 1000
  let current = Number(environment.Variables.RATE)

  if (elapsed < 120) { return } 

  if (passed && (Number(initial.N) > current)) {
  // increase rate
    environment.Variables.RATE = (current + 1).toString(); // maybe need better logic here


  } else { // decrese rate
    let throttledRate = Math.ceil(current * 0.5);
    environment.Variables.RATE = throttledRate.toString();
  }

  setPostLambdaConfig(environment)
}

const tuneUp = async (current, environment) => {
  environment.Variables.RATE = (current + 1).toString()
  setPostLambdaConfig(environment)
}

const tuneDown = async (current, environment) => {
  let throttledRate = Math.ceil(current * 0.5);
  environment.Variables.RATE = throttledRate.toString();
  setPostLambdaConfig(environment)
}
// Item: {
//   stat: { S: "tune" },
//   initial: { N: `${tuneStats.initial}` },
//   current: { N: `${tuneStats.current}` },
//   last: { N: `${tuneStats.now}`}
// }


// export function to handler
module.exports = async (passed) => {
  const { Environment: environment } = await getPostLambdaConfig();
  const pastTune = await getTune();
  let { initial, last } = pastTune;
  let elapsed = (Date.now() - Number(last.N)) / 1000
  let current = Number(environment.Variables.RATE)

  if (elapsed < 120) { return } 

  // if a tune has been done in the past check on the status of passed variable
  // if passed is true and rate is less than initial
  if (pastTune.Item !== undefined) {
    
    //conditions for tuning up
    tuneUp(current, environment);

    // conditions for tuning down
    tuneDown(current, environment);

  } else if (!passed) {
    tuneDown(pastTune, environment);
  }

}

/*

If tune has occured in last two minutes break do not perform tune

pastTune true && passed false -> perform tune down and write to DB
pastTune true && passed true -> 
  if current rate is less than initial rate increase rate
  if last tune time was less than 2 minutes ago don't change rate.
pastTune false && passed true -> don't perform tune
pastTune false && passed false -> perform tune down and write to DB

*/