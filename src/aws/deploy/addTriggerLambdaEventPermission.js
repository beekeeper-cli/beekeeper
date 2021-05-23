/**
 * Exports an async function that adds the CRON job trigger to the trigger lambda and creates the trigger lambda as the target on the CRON job.
 * @module addTriggerLambdaEventPermission
 */
const {
  LambdaClient,
  AddPermissionCommand,
} = require("@aws-sdk/client-lambda");
const {
  CloudWatchEventsClient,
  PutTargetsCommand,
} = require("@aws-sdk/client-cloudwatch-events");
const logger = require("../../utils/logger")("dev");

/**
 * Adds event bridge permission to lambda (CRON JOB)
 * @param {LambdaClient} lambda This is the lambda client.
 * @param {String} lambdaName This is the name of the lambda function.
 * @param {String} sourceArn This is the Event Bridge CRON job arn.
 * @returns {undefined}
 */
const addLambdaPermission = async (lambda, lambdaName, sourceArn) => {
  let params = {
    Action: "lambda:InvokeFunction",
    FunctionName: lambdaName,
    Principal: "events.amazonaws.com",
    SourceArn: sourceArn,
    StatementId: `${Math.random().toString(16).substring(2)}`,
  };

  const command = new AddPermissionCommand(params);

  try {
    await lambda.send(command);
    logger.debugSuccess(`Successfully added permission to triggerLambda.`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Adds the trigger lambda as the target to the event bridge CRON job.
 * @param {CloudWatchEventsClient} cloudwatchEvent This is the cloudwatch event client.
 * @param {String} cronJobName This is the name of the CRON job.
 * @param {String} triggerLambdaArn This is the trigger lambda function arn.
 * @returns {undefined}
 */
const createTarget = async (cloudwatchEvent, cronJobName, triggerLambdaArn) => {
  const params = {
    Rule: cronJobName,
    Targets: [
      {
        Arn: triggerLambdaArn,
        Id: cronJobName,
      },
    ],
  };

  const command = new PutTargetsCommand(params);

  try {
    await cloudwatchEvent.send(command);
    logger.debugSuccess(`Successfully created CloudWatchEvent Target: ${triggerLambdaArn}`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Exports addTriggerLambdaEventPermission
 * @param {String} region This is the region of where this AWS service is deployed.
 * @param {String} lambdaName This is the name of the trigger lambda function.
 * @param {String} sourceArn This is the Event Bridge CRON job arn.
 * @param {String} cronJobName This is the name of the CRON job.
 * @param {String} triggerLambdaArn This is the trigger lambda function arn.
 */
module.exports = async (region, lambdaName, sourceArn, cronJobName, triggerLambdaArn) => {
  const lambda = new LambdaClient({ region });
  const cloudwatchEvent = new CloudWatchEventsClient({ region });

  await addLambdaPermission(lambda, lambdaName, sourceArn);
  await createTarget(cloudwatchEvent, cronJobName, triggerLambdaArn);
};
