const path = require("path");
const logger = require('../utils/logger')('commands:deploy');
const deployS3 = require('../aws/deploy/deployS3');
const deployDLQ = require('../aws/deploy/deployDLQ');
const deploySQS = require("../aws/deploy/deploySQS");
const deployDynamo = require("../aws/deploy/deployDynamo");
const deployApiGateway = require("../aws/deploy/deployApiGateway");
// const deployPreLambda = require('../aws/deploy/deployPreLambda');

const REGION = "us-east-2";
const DIRECTORY_TO_UPLOAD = path.join(__dirname, "..", "..", "assets", "s3");
const S3_NAME = "wr-teamsix-s3"
const DLQ_NAME = "wr-teamsix-dlq"
const SQS_NAME = "wr-teamsix-sqs"
const DYNAMO_NAME = "wr-teamsix-ddb"
const API_GATEWAY_NAME = "wr-teamsix-ddb"

module.exports = async () => {
  logger.highlight('Deploying waiting room infrastructure');
  // exit our process since we don't want to continue with invalid configuration.
  // process.exit(1);

  // await deployS3(REGION, S3_NAME, DIRECTORY_TO_UPLOAD); // works
  // const deadLetterQueueARN = await deployDLQ(REGION, DLQ_NAME); // works
  // const sqsURL = await deploySQS(REGION, SQS_NAME, deadLetterQueueARN); // works
  // await deployDynamo(REGION, DYNAMO_NAME); // works
  await deployApiGateway(REGION, API_GATEWAY_NAME);
}