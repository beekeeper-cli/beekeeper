const path = require("path");
const logger = require('../utils/logger')('commands:deploy');
const deployS3 = require('../aws/deploy/deployS3');
const deployDLQ = require('../aws/deploy/deployDLQ');
const deploySQS = require("../aws/deploy/deploySQS");
const deployDynamo = require("../aws/deploy/deployDynamo");
const deployApiGateway = require("../aws/deploy/deployApiGateway");
const deployPostLambda = require("../aws/deploy/deployPostLambda");
const createRole = require("../aws/deploy/createRole");
const deployPreLambda = require('../aws/deploy/deployPreLambda');
const deployCloudwatchEvent = require('../aws/deploy/deployCloudwatchEvent');
const deployPollingRoute = require("../aws/deploy/deployPollingRoute"); 
// const deployS3Objects = require("../aws/deploy/deployS3Objects");

const REGION = "us-east-2";
const DIRECTORY_TO_UPLOAD = path.join(__dirname, "..", "..", "assets", "s3");
const POST_LAMBDA_ASSET = path.join(__dirname, "..", "..", "assets", "postlambda", 'index.js.zip');
const PRE_LAMBDA_ASSET = path.join(__dirname, "..", "..", "assets", "prelambda", 'index.js.zip');
const S3_NAME = "wr-teamsix-s3"
const DLQ_NAME = "wr-teamsix-dlq"
const SQS_NAME = "wr-teamsix-sqs"
const DYNAMO_NAME = "wr-teamsix-ddb"
const API_GATEWAY_NAME = "wr-teamsix-apigateway"
const POST_LAMBDA_NAME = 'wr-teamsix-postlambda'
const PRE_LAMBDA_NAME = 'wr-teamsix-prelambda'
const ROLE_NAME = 'wr-teamsix-master-role'
const CRON_JOB_NAME = 'wr-cronjob-cloudwatchevent'
const STAGE_NAME = 'sealbuzz-production';
const RATE = 100

module.exports = async () => {
  logger.highlight('Deploying waiting room infrastructure');

  const roleArn = await createRole(REGION, ROLE_NAME); // works
  await logger.process(10000, '%s sealing buzz...');
  console.log('\n');

  const bucketObjectTld = await deployS3(REGION, S3_NAME, DIRECTORY_TO_UPLOAD); // works

  const deadLetterQueueArn = await deployDLQ(REGION, DLQ_NAME); // works
  const sqsUrl = await deploySQS(REGION, SQS_NAME, deadLetterQueueArn); // works
  // set up deployDynamo to return arn
  const dbArn = await deployDynamo(REGION, DYNAMO_NAME); // works
  const postLambdaArn = await deployPostLambda(REGION, POST_LAMBDA_NAME, sqsUrl, POST_LAMBDA_ASSET, roleArn, DYNAMO_NAME, RATE);

  await deployCloudwatchEvent(REGION, postLambdaArn, CRON_JOB_NAME);

  const preLambdaArn = await deployPreLambda(REGION, PRE_LAMBDA_NAME, sqsUrl, PRE_LAMBDA_ASSET, roleArn, bucketObjectTld);
  
  // set up to return rest ApiId
  const {restApiId, stageSealBuzzUrl} = await deployApiGateway(REGION, API_GATEWAY_NAME, preLambdaArn, STAGE_NAME);
  const stagePollingUrl = await deployPollingRoute(restApiId, REGION, API_GATEWAY_NAME, dbArn, roleArn, bucketObjectTld, STAGE_NAME);
  // await deployS3Objects(REGION, DIRECTORY_TO_UPLOAD, S3_NAME, stagePollingUrl);

  logger.log(stageSealBuzzUrl);

  // Fix bucketObjectTld URL = remove '/'
  // Finish generating the polling.js for waitingroom
}