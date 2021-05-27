/**
 * Contains all the logic for changing the rate on the trigger lambda.
 * @module tune
 */

const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.REGION });
const FUNC_NAME = process.env.FUNC_NAME;
const lambda = new AWS.Lambda({apiVersion: '2015-03-31'});
const { writeTune, getTune } = require('./dynamo');

/**
 * Mutates a DynamoDB object into a usable format.
 * @param {Object} tune 
 */
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

/**
 * Gets the current configuration off the trigger lambda
 * @returns {Object}
 */
const getTriggerLambdaConfig = async () => {
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

/**
 * Sets the environmental varialbe RATE on the Trigger lambda.
 * @param {Number} current The rate to be set
 * @param {Object} environment The configuration of the lambda
 */
const setTriggerLambdaConfig = async (current, environment) => {
  environment.Variables.RATE = current.toString()

  const params = {
    FunctionName: FUNC_NAME,
    Environment: environment
  }

  try {
    await lambda.updateFunctionConfiguration(params).promise();
    console.log(`triggerLambda rate throttled to ${current}`);
  } catch (e) {
    console.log(e);
  }
}

/**
 * Calculates the new rate if the rate is increased. The rate is calculated as the current rate plus 25% of the difference between the initial rate and the current rate.
 * @param {Number} initial 
 * @param {Number} current 
 * @returns {Number} The new higher rate
 */
const tuneUp = (initial, current) => {
  return Math.ceil(current + (initial - current) * 0.25);
}

/**
 * Calculates the new rate if the rate is decreased.  The rate is calculated as 50% of the current rate rounded up.
 * @param {Number} current rate 
 * @returns {Number} The new lower rate
 */
const tuneDown = (current) => {
  return Math.ceil(current * 0.5);
}

/**
 * Exports function for performing a tune on the Trigger lambda RATE.
 * @param {Boolean} passed 
 */
module.exports = async (passed) => {
  const { Environment: environment } = await getTriggerLambdaConfig();
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

  let { initial, last, current } = tuneStat.Item;

  // if health check does not pass tune down
  if (!passed) {
    current = tuneDown(current);
    last = Date.now();
    await setTriggerLambdaConfig(current, environment);
    
  // if health check passes and rate is less than initial tune up
  } else if (current < initial) {
    //conditions for tuning up
    current = tuneUp(current, initial);
    last = Date.now()
    await setTriggerLambdaConfig(current, environment);
  }

  await writeTune({initial, last, current});
}