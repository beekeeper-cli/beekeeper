const path = require("path");
const logger = require('../utils/logger')('commands:deploy');
const deployS3 = require('../aws/deploy/deployS3');
const deployDLQ = require('../aws/deploy/deployDLQ');
const deploySQS = require("../aws/deploy/deploySQS");
const deployDynamo = require("../aws/deploy/deployDynamo");
const deployApiGateway = require("../aws/deploy/deployApiGateway");
const deployPostLambda = require("../aws/deploy/deployPostLambda");
const createRole = require("../aws/deploy/createRole");
// const deployPreLambda = require('../aws/deploy/deployPreLambda');

const REGION = "us-east-2";
const DIRECTORY_TO_UPLOAD = path.join(__dirname, "..", "..", "assets", "s3");
const POST_LAMBDA_ASSET = path.join(__dirname, "..", "..", "assets", "postlambda", 'index.js.zip');
const S3_NAME = "wr-teamsix-s3"
const DLQ_NAME = "wr-teamsix-dlq"
const SQS_NAME = "wr-teamsix-sqs"
const DYNAMO_NAME = "wr-teamsix-ddb"
const API_GATEWAY_NAME = "wr-teamsix-ddb"
const POST_LAMBDA_NAME = 'wr-teamsix-postlambda'
const ROLE_NAME = 'wr-teamsix-master-role'

module.exports = async () => {
  logger.highlight('Deploying waiting room infrastructure');
  // exit our process since we don't want to continue with invalid configuration.
  // process.exit(1);

  // const roleArn = await createRole(REGION, ROLE_NAME); // works
  // await deployS3(REGION, S3_NAME, DIRECTORY_TO_UPLOAD); // works
  // const deadLetterQueueARN = await deployDLQ(REGION, DLQ_NAME); // works
  // const sqsURL = await deploySQS(REGION, SQS_NAME, deadLetterQueueARN); // works
  
  logger.process(10, '%s sealing buzz...');
  // Resume @ deployPostLambda
  // Set reserved concurrency
  // Set up CRON trigger (Event), 
  // Upload actual lambda code
    // replace the env variable
  // const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

  // await deployPostLambda(REGION, POST_LAMBDA_NAME, sqsURL, POST_LAMBDA_ASSET, roleArn);

  // await deployDynamo(REGION, DYNAMO_NAME); // works
  
  // await deployApiGateway(REGION, API_GATEWAY_NAME);
}