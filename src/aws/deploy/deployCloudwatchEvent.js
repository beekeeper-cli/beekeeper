const {CloudWatchEventsClient, PutRuleCommand, PutTargetsCommand} = require("@aws-sdk/client-cloudwatch-events");
const logger = require('../../utils/logger')('commands:deployCloudwatchEvent');

const createTarget = async (cloudwatchEvent) => {
  let params = {
    Rule: "cronJobby",
    Targets: [
      {
        Arn: "arn:aws:lambda:us-east-2:212700019935:function:post-sqs",
        Id: "some-random-id"
      }
    ]
  }
  let command = new PutTargetsCommand(params);
  let result = await cloudwatchEvent.send(command);
  console.log(result);
}

const createEvent = async (cloudwatchEvent) => {
  const params = { 
    Name: "cronJobby",
    State: "ENABLED",
    Description: "Executes the lambdas once every minute",
    ScheduleExpression: "rate(1 minute)",
    EventBusName: "default"
  };
  const command = new PutRuleCommand(params);

  try {
    await cloudwatchEvent.send(command);
    logger.log(`Successfully created Cloudwatch Event Rule: ${"CronJob"}`);
  } catch (err) {
    logger.warning("Error", err);
  }
}

module.exports = async (region) => {
  let cloudwatchEvent = new CloudWatchEventsClient({region});

  await createEvent(cloudwatchEvent);
  await createTarget(cloudwatchEvent);
};