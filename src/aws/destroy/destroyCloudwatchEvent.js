/**
 * Exports an async function that tears down the Cloudwatch Event Rule
 * @module destroyCloudwatchEvent
 */
const {CloudWatchEventsClient, DeleteRuleCommand, RemoveTargetsCommand} = require("@aws-sdk/client-cloudwatch-events");
const logger = require('../../utils/logger')('dev');

/**
 * Removes the Cloudwatch Target from the Cloudwatch Event Rule
 * @param {CloudWatchEventsClient} cloudwatchEvent This is the CloudwatchEvent client
 * @param {String} name This is the CloudwatchEvent rule target name
 * @throws Will throw an error if CloudwatchEvent client fails to execute its command
 */
const destroyCloudwatchTarget = async (cloudwatchEvent, name) => {
  const params = {
    Rule: name,
    Ids: [name]
  }
  const command = new RemoveTargetsCommand(params);

  try { 
    await cloudwatchEvent.send(command);
    logger.debugSuccess(`Successfully deleted Cloudwatch Event Target: ${name}`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
}

/**
 * Tears down the Cloudwatch Event Rule
 * @param {CloudWatchEventsClient} cloudwatchEvent This is the CloudwatchEvent client
 * @param {String} eventName This is the CloudwatchEvent Rule name
 * @throws Will throw an error if CloudwatchEvent client fails to execute its command
 */
const destroyCloudwatchEvent = async (cloudwatchEvent, eventName) => {
  const params = {
    Name: eventName,
  };
  
  const command = new DeleteRuleCommand(params);

  try {
    await cloudwatchEvent.send(command);
    logger.debugSuccess(`Successfully deleted Cloudwatch Event Rule: ${eventName}`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
}

/**
 * Exports destroyCloudwatchEvent
 * @param {String} region This is the region of where this AWS service is deployed.
 * @param {String} name This is the name of the CloudwatchEvent rule
 */
module.exports = async (region, name) => {
  const cloudwatchEvent = new CloudWatchEventsClient({region});
  await destroyCloudwatchTarget(cloudwatchEvent, name);
  await destroyCloudwatchEvent(cloudwatchEvent, name);
};