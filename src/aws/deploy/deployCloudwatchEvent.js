/**
 * Exports an async function that creates a CloudWatchEventRule for our post Lambdas. The rule is to execute the Lambdas once every minute. What the post queue Lambdas do is pull tokens of the SQS queue in a predetermined loop. Between that looping logic, and the once a minute execution rule set here, we achieve the rate the user wants.
 * @module deployCloudwatchEvent
 */
const {
  CloudWatchEventsClient,
  PutRuleCommand,
  PutTargetsCommand,
} = require("@aws-sdk/client-cloudwatch-events");
const logger = require("../../utils/logger")("dev");

// [Ian Confirm deletion]
// const createTarget = async (cloudwatchEvent, cronJobName, postLambdaArn) => {
//   const params = {
//     Rule: cronJobName,
//     Targets: [
//       {
//         Arn: postLambdaArn,
//         Id: cronJobName,
//       },
//     ],
//   };

//   const command = new PutTargetsCommand(params);

//   try {
//     await cloudwatchEvent.send(command);
//     logger.debugSuccess(`Successfully created CloudWatchEvent Target: ${postLambdaArn}`);
//   } catch (err) {
//     logger.debugError("Error", err);
//     throw new Error(err);
//   }
// };

/**
 * Creates the Cloud Watch event rule that executes the post queue Lambdas once a minute
 * @param {cloudwatchEventsClient} cloudwatchEventsClient Looks like `new CloudWatchEventsClient({ region });`
 * @param {String} cronJobName Initialized in `deploy.js`, looks like `beekeeper-${PROFILE_NAME}-cloudwatcheventcron`
 * @returns {String} Returns an Amazon Resource Number identifying the rule we create here
 */
const createCloudWatchEventRule = async (cloudwatchEventsClient, cronJobName) => {
  const params = {
    Name: cronJobName,
    State: "ENABLED",
    Description: "Executes the lambdas once every minute",
    ScheduleExpression: "rate(1 minute)",
    EventBusName: "default",
  };
  const command = new PutRuleCommand(params);

  try {
    const { RuleArn } = await cloudwatchEventsClient.send(command);
    logger.debugSuccess(`Successfully created Cloudwatch Event Rule: ${RuleArn}`);
    return RuleArn;
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Exports deployCloudwatchEvent
 * @param {String} region A constant destructured from the CLI user's answers in `deploy.js`. Like "us-east-2".
 * @param {String} postLambdaArn A Amazon Resource Number referring to the post queue Lambda we need to put this cloudwatch rule on.
 * @param {String} cronJobName Initialized in `deploy.js`, looks like `beekeeper-${PROFILE_NAME}-cloudwatcheventcron`
 * @returns {String} Returns a Amazon Resource Number identifying this rule we just created.
 */
module.exports = async (region, postLambdaArn, cronJobName) => {
  const cloudwatchEventsClient = new CloudWatchEventsClient({ region });

  const ruleArn = await createCloudWatchEventRule(cloudwatchEventsClient, cronJobName);
  // [Ian Confirm deletion]
  //await createTarget(cloudwatchEvent, cronJobName, postLambdaArn);
  return ruleArn;
};
