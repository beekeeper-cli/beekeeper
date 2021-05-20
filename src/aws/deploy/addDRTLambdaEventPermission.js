
 const {
  LambdaClient,
  AddPermissionCommand,
} = require("@aws-sdk/client-lambda");
const {
  CloudWatchEventsClient,
  PutTargetsCommand,
} = require("@aws-sdk/client-cloudwatch-events");
const logger = require("../../utils/logger")("dev");

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

module.exports = async (region, lambdaName, sourceArn, cronJobName, drtLambdaArn) => {
  const lambda = new LambdaClient({ region });
  const cloudwatchEvent = new CloudWatchEventsClient({ region });

  await addLambdaPermission(lambda, lambdaName, sourceArn);
  await createTarget(cloudwatchEvent, cronJobName, drtLambdaArn);
};
