const {CloudWatchEventsClient, PutRuleCommand, PutTargetsCommand} = require("@aws-sdk/client-cloudwatch-events");
const logger = require('../../utils/logger')('commands:deployCloudwatchEvent');

const createTarget = async (cloudwatchEvent, cronJobName, postLambdaArn) => {
  // const base64String = Buffer.from(cronJobName).toString('base64');

  const params = {
    Rule: cronJobName,
    Targets: [
      {
        Arn: postLambdaArn,
        Id: cronJobName
      }
    ]
  }

  const command = new PutTargetsCommand(params);

  try {
    await cloudwatchEvent.send(command);
    logger.log('Successfully created Target for CloudWatchEvent');
  } catch (err) {
    logger.warning("Error", err);
  }
}

const createEvent = async (cloudwatchEvent, cronJobName) => {
  const params = { 
    Name: cronJobName,
    State: "ENABLED",
    Description: "Executes the lambdas once every minute",
    ScheduleExpression: "rate(1 minute)",
    EventBusName: "default"
  };
  const command = new PutRuleCommand(params);

  try {
    await cloudwatchEvent.send(command);
    logger.log(`Successfully created Cloudwatch Event Rule: ${cronJobName}`);
  } catch (err) {
    logger.warning("Error", err);
  }
}

module.exports = async (region, postLambdaArn, cronJobName) => {
  const cloudwatchEvent = new CloudWatchEventsClient({region});

  await createEvent(cloudwatchEvent, cronJobName);
  await createTarget(cloudwatchEvent, cronJobName, postLambdaArn);
};