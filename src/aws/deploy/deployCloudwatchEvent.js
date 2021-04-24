const {
  CloudWatchEventsClient,
  PutRuleCommand,
  PutTargetsCommand,
} = require("@aws-sdk/client-cloudwatch-events");
const logger = require("../../utils/logger")("deploy");

const createTarget = async (cloudwatchEvent, cronJobName, postLambdaArn) => {
  const params = {
    Rule: cronJobName,
    Targets: [
      {
        Arn: postLambdaArn,
        Id: cronJobName,
      },
    ],
  };

  const command = new PutTargetsCommand(params);

  try {
    await cloudwatchEvent.send(command);
    logger.debug(`Successfully created CloudWatchEvent Target: ${postLambdaArn}`);
  } catch (err) {
    logger.debugError("Error", err);
  }
};

const createCloudWatchEventRule = async (cloudwatchEvent, cronJobName) => {
  const params = {
    Name: cronJobName,
    State: "ENABLED",
    Description: "Executes the lambdas once every minute",
    ScheduleExpression: "rate(1 minute)",
    EventBusName: "default",
  };
  const command = new PutRuleCommand(params);

  try {
    const { RuleArn } = await cloudwatchEvent.send(command);
    logger.debug(`Successfully created Cloudwatch Event Rule: ${RuleArn}`);
    return RuleArn;
  } catch (err) {
    logger.debugError("Error", err);
  }
};

module.exports = async (region, postLambdaArn, cronJobName) => {
  const cloudwatchEvent = new CloudWatchEventsClient({ region });

  const ruleArn = await createCloudWatchEventRule(cloudwatchEvent, cronJobName);
  await createTarget(cloudwatchEvent, cronJobName, postLambdaArn);
  return ruleArn;
};
