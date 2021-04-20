const {CloudWatchEventsClient, DeleteRuleCommand, RemoveTargetsCommand} = require("@aws-sdk/client-cloudwatch-events");
const logger = require('../../utils/logger')('commands:destroyCloudwatchEvent');


const destroyCloudwatchTarget = async (cloudwatchEvent, name) => {
  let params = {
    Rule: name,
    Ids: ["some-random-id"]
  }
  let command = new RemoveTargetsCommand(params);

  try { 
    await cloudwatchEvent.send(command);
    logger.log(`Successfully deleted Cloudwatch Event Target: ${name}`);
  } catch (err) {
    logger.warning("Error", err);
  }
}


const destroyCloudwatchEvent = async (cloudwatchEvent, eventName) => {
  const params = {
    Name: eventName,
  };
  
  const command = new DeleteRuleCommand(params);

  try {
    await cloudwatchEvent.send(command);
    logger.log(`Successfully deleted Cloudwatch Event Rule: ${eventName}`);
  } catch (err) {
    logger.warning("Error", err);
  }
}




module.exports = async (region, name) => {
  let cloudwatchEvent = new CloudWatchEventsClient({region});
  await destroyCloudwatchTarget(cloudwatchEvent, name);
  await destroyCloudwatchEvent(cloudwatchEvent, name);
  // return QueueUrl;
};