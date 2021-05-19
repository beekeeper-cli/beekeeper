/**
 * Exports an async function that removes DynamoDB auto-scaling read and write capacity units
 * @module deployAutoScaling
 */
 const {
  ApplicationAutoScalingClient, 
  DeleteScalingPolicyCommand,
  DeregisterScalableTargetCommand
} = require("@aws-sdk/client-application-auto-scaling");
const logger = require("../../utils/logger")("dev");

/**
 * Function that removes permissions/policy to autoscale read capacity units on a dynamodb table
 * @param {ApplicationAutoScalingClient} autoScaler Looks like 'new ApplicationAutoScalingClient({ region })`
 * @param {String} dynamoName Constant initialized as `beekeeper-${PROFILE_NAME}-ddb`
 * @param {String} writeName Constant initialized as `beekeeper-$PROFILE_NAME}-autoscale-write
 */
const destroyReadScalingPolicy = async (autoScaler, dynamoName, readName) => {
  const params = {
    PolicyName: readName,
    ResourceId: `table/${dynamoName}`,
    ScalableDimension: "dynamodb:table:ReadCapacityUnits",
    ServiceNamespace: "dynamodb"
  };
  
  const command = new DeleteScalingPolicyCommand(params);

  try {
    await autoScaler.send(command);
    logger.debugSuccess(`Successfully deleted scaling policy: ${readName}`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
}

/**
 * Function that removes permissions/policy to autoscale write capacity units on a dynamodb table
 * @param {ApplicationAutoScalingClient} autoScaler Looks like 'new ApplicationAutoScalingClient({ region })`
 * @param {String} dynamoName Constant initialized as `beekeeper-${PROFILE_NAME}-ddb`
 * @param {String} writeName Constant initialized as `beekeeper-$PROFILE_NAME}-autoscale-write
 */
const destroyWriteScalingPolicy = async (autoScaler, dynamoName, writeName) => {
  const params = {
    PolicyName: writeName,
    ResourceId: `table/${dynamoName}`,
    ScalableDimension: "dynamodb:table:WriteCapacityUnits",
    ServiceNamespace: "dynamodb"
  };
  
  const command = new DeleteScalingPolicyCommand(params);

  try {
    await autoScaler.send(command);
    logger.debugSuccess(`Successfully deleted scaling policy: ${readName}`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
}

/**
 * Function that removes the event target to autoscale read capacity units on a dynamodb table
 * @param {ApplicationAutoScalingClient} autoScaler Looks like 'new ApplicationAutoScalingClient({ region })`
 * @param {String} dynamoName Constant initialized as `beekeeper-${PROFILE_NAME}-ddb`
 */
const destroyReadScalingTarget = async (autoScaler, dynamoName) => {
  const params = {
    ResourceId: `table/${dynamoName}`,
    ScalableDimension: "dynamodb:table:ReadCapacityUnits",
    ServiceNamespace: "dynamodb"
  };
  
  const command = new DeregisterScalableTargetCommand(params);

  try {
    await autoScaler.send(command);
    logger.debugSuccess(`Successfully deleted read scaling target`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
}

/**
 * Function that removes the event target to autoscale write capacity units on a dynamodb table
 * @param {ApplicationAutoScalingClient} autoScaler Looks like 'new ApplicationAutoScalingClient({ region })`
 * @param {String} dynamoName Constant initialized as `beekeeper-${PROFILE_NAME}-ddb`
 */
const destroyWriteScalingTarget = async (autoScaler, dynamoName) => {
  const params = {
    ResourceId: `table/${dynamoName}`,
    ScalableDimension: "dynamodb:table:WriteCapacityUnits",
    ServiceNamespace: "dynamodb"
  };
  
  const command = new DeregisterScalableTargetCommand(params);

  try {
    await autoScaler.send(command);
    logger.debugSuccess(`Successfully deleted write scaling target`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
}


/**
 * Exports destroyAutoScaling
 * @param {String} region A constant destructured from the CLI user's answers in `deploy.js`. Like "us-east-2".
 * @param {String} dynamoName Constant initialized as `beekeeper-${PROFILE_NAME}-ddb`
 * @param {String} readName Constant initialized as `beekeeper-${PROFILE_NAME}-autoscale-read`
 * @param {String} writeName Constant initialized as `beekeeper-${PROFILE_NAME}-autoscale-write`
 */
module.exports = async (region, dynamoName, readName, writeName) => {
  const autoScaler = new ApplicationAutoScalingClient({ region });
  await destroyReadScalingPolicy(autoScaler, dynamoName, readName);
  await destroyWriteScalingPolicy(autoScaler, dynamoName, writeName);
  await destroyReadScalingTarget(autoScaler, dynamoName);
  await destroyWriteScalingTarget(autoScaler, dynamoName);
};