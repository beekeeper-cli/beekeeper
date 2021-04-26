const {
  LambdaClient,
  AddPermissionCommand,
  PublishVersionCommand,
  PutProvisionedConcurrencyConfigCommand,
} = require("@aws-sdk/client-lambda");
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
    const obj = await lambda.send(command);
    console.log(obj);
    logger.debugSuccess(`Successfully created postLambda ${version}.`);
    return obj.Version;
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

const provisionConcurrency = async (lambda, lambdaName, version, rate) => {
  const provision = rate / 50;

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

module.exports = async (region, lambdaName, sourceArn, rate) => {
  // Create a Lambda client service object
  const lambda = new LambdaClient({ region });

  const version = await publishVersion(lambda, lambdaName);

  provisionConcurrency(lambda, lambdaName, version, rate);

  // Add API Gateway Permission (Solution to AWS Bug)
  await addLambdaPermission(lambda, lambdaName, sourceArn, qualifier);
};
