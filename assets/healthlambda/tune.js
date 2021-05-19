const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.REGION });
const FUNC_NAME = process.env.FUNC_NAME;
const lambda = new AWS.Lambda({apiVersion: '2015-03-31'});
const { writeTune, getTune } = require('./dynamo');

// dynamo parser
const parseTune = (tune) => {
  Object.keys(tune.Item).forEach(obj => {
    let [key, value] = Object.entries(tune.Item[obj])[0]

    if (key === 'S') {
      tune.Item[obj] = value;
    } else if (key === 'N') {
      tune.Item[obj] = Number(value);
    }
  });
}

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
const setPostLambdaConfig = async (current, environment) => {
  environment.Variables.RATE = current.toString()

  const params = {
    FunctionName: FUNC_NAME,
    Environment: environment
  }

  try {
    await lambda.updateFunctionConfiguration(params).promise();
    console.log(`postLambda rate throttled to ${current}`);
  } catch (e) {
    console.log(e);
  }
}

const tuneUp = (initial, current) => {
  return Math.ceil(current + (initial - current) * 0.5);
}

const tuneDown = (current) => {
  return Math.ceil(current * 0.5);
}


// export function to handler
module.exports = async (passed) => {
  const { Environment: environment } = await getPostLambdaConfig();
  const tuneStat = await getTune();
  
  // if a tune has not been performed create a tuneStat object else parse the past tune
  if (tuneStat.Item === undefined) {
    const rate = Number(environment.Variables.RATE);

    tuneStat.Item = { 
      initial: rate,
      current: rate,
      last: Date.now()
    }
  } else {
    parseTune(tuneStat)
  }
  
  console.log("parsedStat", tuneStat)

  let { initial, last, current } = tuneStat.Item;
  // let elapsed = (Date.now() - last) / 1000;

  // if (elapsed < 120) { return } 

  // if a tune has been done in the past check on the status of passed variable

  // if passed is true and rate is less than initial
  if (!passed) {
    current = tuneDown(current);
    last = Date.now();
    await setPostLambdaConfig(current, environment);

  } else if (current < initial) {
    //conditions for tuning up
    current = tuneUp(current, initial);
    last = Date.now()
    await setPostLambdaConfig(current, environment);
  }

  await writeTune({initial, last, current});
}

/*

If it fails tune down and record the new rate
If it passes and current rate is less than initial rate tune up

If there is no pastTune write the current settings to a tune





If tune has occured in last two minutes break do not perform tune

pastTune true && passed false -> perform tune down and write to DB
pastTune true && passed true -> 
  if current rate is less than initial rate increase rate
  if last tune time was less than 2 minutes ago don't change rate.
pastTune false && passed true -> don't perform tune
pastTune false && passed false -> perform tune down and write to DB

*/