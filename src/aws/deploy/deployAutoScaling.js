/**
 * Exports an async function that enables DynamoDB auto-scaling read and write capacity units
 * @module deployAutoScaling
 */
 const {
  ApplicationAutoScalingClient, 
  RegisterScalableTargetCommand,
  PutScalingPolicyCommand
} = require("@aws-sdk/client-application-auto-scaling");
const logger = require("../../utils/logger")("dev");

/**
 * Function that creates the event target to autoscale write capacity units on a dynamodb table
 * @param {ApplicationAutoScalingClient} autoScaler Looks like 'new ApplicationAutoScalingClient({ region })`
 * @param {String} dynamoName Constant initialized as `beekeeper-${PROFILE_NAME}-ddb`
 */
const registerScalableWrites = async (autoScaler, dynamoName) => {
  const params = {
    MinCapacity: 5,
    MaxCapacity: 100,
    ResourceId: `table/${dynamoName}`,
    ScalableDimension: "dynamodb:table:WriteCapacityUnits",
    ServiceNamespace: "dynamodb"
  }

  const command = new RegisterScalableTargetCommand(params);

  try {
    await autoScaler.send(command);
    logger.debugSuccess(`Successfully created scalabe writes for table: ${dynamoName}`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
}

/**
 * Function that creates the event target to autoscale read capacity units on a dynamodb table
 * @param {ApplicationAutoScalingClient} autoScaler Looks like 'new ApplicationAutoScalingClient({ region })`
 * @param {String} dynamoName Constant initialized as `beekeeper-${PROFILE_NAME}-ddb`
 */
const registerScalableReads = async (autoScaler, dynamoName) => {
  const params = {
    MinCapacity: 5,
    MaxCapacity: 100,
    ResourceId: `table/${dynamoName}`,
    ScalableDimension: "dynamodb:table:ReadCapacityUnits",
    ServiceNamespace: "dynamodb"
  }

  const command = new RegisterScalableTargetCommand(params);

  try {
    await autoScaler.send(command);
    logger.debugSuccess(`Successfully created scalabe reads for table: ${dynamoName}`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
}


/**
 * Function that creates permissions/policy to autoscale write capacity units on a dynamodb table
 * @param {ApplicationAutoScalingClient} autoScaler Looks like 'new ApplicationAutoScalingClient({ region })`
 * @param {String} dynamoName Constant initialized as `beekeeper-${PROFILE_NAME}-ddb`
 * @param {String} writeName Constant initialized as `beekeeper-$PROFILE_NAME}-autoscale-write
 */
const createWriteScalingPolicy = async (autoScaler, dynamoName, writeName) => {
  const params = {
    PolicyName: writeName,
    PolicyType: "TargetTrackingScaling",
    ResourceId: `table/${dynamoName}`,
    ScalableDimension: "dynamodb:table:WriteCapacityUnits",
    ServiceNamespace: "dynamodb",
    TargetTrackingScalingPolicyConfiguration: {
      PredefinedMetricSpecification: {PredefinedMetricType: "DynamoDBWriteCapacityUtilization"},
      ScaleOutCooldown: 0,
      ScaleInCooldown: 5,
      TargetValue: 75.0
    }
  };

  const command = new PutScalingPolicyCommand(params);

  try {
    await autoScaler.send(command);
    logger.debugSuccess(`Successfully created scalabe write-policy: ${writeName}`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }

}

/**
 * Function that creates permissions/policy to autoscale read capacity units on a dynamodb table
 * @param {ApplicationAutoScalingClient} autoScaler Looks like 'new ApplicationAutoScalingClient({ region })`
 * @param {String} dynamoName Constant initialized as `beekeeper-${PROFILE_NAME}-ddb`
 * @param {String} writeName Constant initialized as `beekeeper-$PROFILE_NAME}-autoscale-read
 */
const createReadScalingPolicy = async (autoScaler, dynamoName, readName) => {
  const params = {
    PolicyName: readName,
    PolicyType: "TargetTrackingScaling",
    ResourceId: `table/${dynamoName}`,
    ScalableDimension: "dynamodb:table:ReadCapacityUnits",
    ServiceNamespace: "dynamodb",
    TargetTrackingScalingPolicyConfiguration: {
      PredefinedMetricSpecification: {PredefinedMetricType: "DynamoDBReadCapacityUtilization"},
      ScaleOutCooldown: 0,
      ScaleInCooldown: 5,
      TargetValue: 75.0
    }
  };

  const command = new PutScalingPolicyCommand(params);

  try {
    await autoScaler.send(command);
    logger.debugSuccess(`Successfully created scalabe read-policy: ${readName}`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }

}

/**
 * Exports deployAutoScaling
 * @param {String} region A constant destructured from the CLI user's answers in `deploy.js`. Like "us-east-2".
 * @param {String} dynamoName Constant initialized as `beekeeper-${PROFILE_NAME}-ddb`
 * @param {String} readName Constant initialized as `beekeeper-${PROFILE_NAME}-autoscale-read`
 * @param {String} writeName Constant initialized as `beekeeper-${PROFILE_NAME}-autoscale-write`
 */
module.exports = async (region, dynamoName, writeName, readName) => {
    const autoScaler = new ApplicationAutoScalingClient({ region });

    await registerScalableWrites(autoScaler, dynamoName);
    await registerScalableReads(autoScaler, dynamoName);
    await createWriteScalingPolicy(autoScaler, dynamoName, writeName);
    await createReadScalingPolicy(autoScaler, dynamoName, readName);
  };
  