const { LambdaClient, CreateFunctionCommand, PutFunctionConcurrencyCommand } = require("@aws-sdk/client-lambda");
const logger = require('../../utils/logger')('commands:deployPostLambda');
const fs = require('fs');
const path = require("path");

const createPostLambda = async (lambda, lambdaName, sqsURL, code, role, region, dynamoName) => {
  const params = {
    FunctionName: lambdaName,
    Role: role,
    Handler: "index.handler",
    Runtime: "nodejs12.x",
    Description: "consumerLambda",
    Environment: {
      Variables: {
        "SQS_URL": sqsURL,
        "REGION": region, 
        "TABLE_NAME": dynamoName,
      }
    },
    Code: { ZipFile: code }
  };

  const command = new CreateFunctionCommand(params);

  try {
    await lambda.send(command);
    logger.log(`Successfully created PostLambda: ${lambdaName}`);
  } catch (err) {
    logger.warning("Error", err);
  }
}

const setLambdaConcurrency = async (lambda, lambdaName, rate) => {
  // Assumption for now is rate is requests per minute, and one lambda does 10 messages per minute pursuant to CloudFront cronjob
  const reserveAmount = rate / 10;

  const params = {
    FunctionName: lambdaName,
    ReservedConcurrentExecutions: reserveAmount
  }

  const command = new PutFunctionConcurrencyCommand(params);

  try {
    await lambda.send(command);
    logger.log(`Successfully set LambdaReserveConcurrency: ${rate}`);
  } catch (err) {
    logger.warning("Error", err);
  }
}

module.exports = async (region, lambdaName, sqsURL, asset, role, dynamoName, rate) => {  
  // Create a Lambda client service object
  let code = fs.readFileSync(asset);
  const lambda = new LambdaClient({ region });

  // Create post lambda
  await createPostLambda(lambda, lambdaName, sqsURL, code, role, region, dynamoName);
  await setLambdaConcurrency(lambda, lambdaName, rate);
};

// provisions
// cloud events
// let sqsUrl = process.env.SQS_URL - put this in the function code

// InvalidParameterValueException: The role defined for the function cannot be assumed by Lambda.

