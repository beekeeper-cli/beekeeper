const {
  LambdaClient,
  AddPermissionCommand,
  PublishVersionCommand,
  PutProvisionedConcurrencyConfigCommand,
} = require("@aws-sdk/client-lambda");
const {
  CloudWatchEventsClient,
  PutTargetsCommand,
} = require("@aws-sdk/client-cloudwatch-events");
const logger = require("../../utils/logger")("dev");

const addLambdaPermission = async (lambda, lambdaName, sourceArn, version) => {
  let params = {
    Action: "lambda:InvokeFunction",
    FunctionName: lambdaName,
    Principal: "events.amazonaws.com",
    SourceArn: sourceArn,
    StatementId: `${Math.random().toString(16).substring(2)}`,
    Qualifier: version,
  };

  const command = new AddPermissionCommand(params);

  try {
    await lambda.send(command);
    logger.debugSuccess(`Successfully added permission to postLambda.`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

const publishVersion = async (lambda, lambdaName) => {
  const params = {
    FunctionName: lambdaName,
  };

  const command = new PublishVersionCommand(params);

  try {
    const { Version, FunctionArn } = await lambda.send(command);
    logger.debugSuccess(`Successfully created postLambda ${Version}.`);
    return { Version, FunctionArn };
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

const provisionConcurrency = async (lambda, lambdaName, version) => {
  const provision = 2;

  const params = {
    FunctionName: lambdaName,
    ProvisionedConcurrentExecutions: provision,
    Qualifier: version,
  };

  const command = new PutProvisionedConcurrencyConfigCommand(params);

  try {
    await lambda.send(command);
    logger.debugSuccess(
      `Successfully provisioned concurrency for ${lambdaName} version ${version}.`
    );
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

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
    logger.debugSuccess(`Successfully created CloudWatchEvent Target: ${postLambdaArn}`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

module.exports = async (region, lambdaName, sourceArn, rate, cronJobName) => {
  // Create a Lambda client service object
  const lambda = new LambdaClient({ region });
  const cloudwatchEvent = new CloudWatchEventsClient({ region });

  // creates a new lambda version and returns the new function arn and version number
  const { Version:version, FunctionArn:lambdaArn } = await publishVersion(lambda, lambdaName);

  provisionConcurrency(lambda, lambdaName, version, rate);

  // Add API Gateway Permission (Solution to AWS Bug)
  await addLambdaPermission(lambda, lambdaName, sourceArn, version);
  await createTarget(cloudwatchEvent, cronJobName, lambdaArn);
};
