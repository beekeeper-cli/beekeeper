/**
 * Exports async function that adds a CloudWatch EventBridge trigger to the DRT lambda.
 * @module addDRTLambdaEventPermission
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
    logger.debugSuccess(`Successfully added permission to DRT-Lambda.`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Adds the drt lambda as the target to the event bridge CRON job.
 * @param {CloudWatchEventsClient} cloudwatchEvent This is the cloudwatch event client.
 * @param {String} cronJobName This is the name of the CRON job.
 * @param {String} drtLambdaArn This is the DRT lambda function arn.
 * @returns {undefined}
 */
const createTarget = async (cloudwatchEvent, cronJobName, drtLambdaArn) => {
  const params = {
    Rule: cronJobName,
    Targets: [
      {
        Arn: drtLambdaArn,
        Id: cronJobName,
      },
    ],
  };

  const command = new PutTargetsCommand(params);

  try {
    await cloudwatchEvent.send(command);
    logger.debugSuccess(`Successfully created CloudWatchEvent Target: ${drtLambdaArn}`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Exports addDRTLambdaEventPermission
 * @param {String} region This is the region of where this AWS service is deployed.
 * @param {String} lambdaName This is the name of the drt lambda function.
 * @param {String} sourceArn This is the Event Bridge CRON job arn.
 * @param {String} cronJobName This is the name of the CRON job.
 * @param {String} drtLambdaArn This is the drt lambda function arn.
 */
module.exports = async (region, lambdaName, sourceArn, cronJobName, drtLambdaArn) => {
  const lambda = new LambdaClient({ region });
  const cloudwatchEvent = new CloudWatchEventsClient({ region });

  await addLambdaPermission(lambda, lambdaName, sourceArn);
  await createTarget(cloudwatchEvent, cronJobName, drtLambdaArn);
};
