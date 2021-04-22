const path = require("path");
const logger = require('../utils/logger')('deploy');

const createRole = require("../aws/deploy/createRole");
const deployS3 = require('../aws/deploy/deployS3');
const deployDlq = require('../aws/deploy/deployDlq');
const deploySqs = require("../aws/deploy/deploySqs");
const deployDynamo = require("../aws/deploy/deployDynamo");
const deployApiGateway = require("../aws/deploy/deployApiGateway");
const deployPostLambda = require("../aws/deploy/deployPostLambda");
const deployPreLambda = require('../aws/deploy/deployPreLambda');
const deployCloudwatchEvent = require('../aws/deploy/deployCloudwatchEvent');
const deployPollingRoute = require("../aws/deploy/deployPollingRoute"); 
const deployPollingS3Object = require("../aws/deploy/deployPollingS3Object");

const REGION = "us-east-2";
const S3_ASSET_PATH = path.join(__dirname, "..", "..", "assets", "s3");
const POST_LAMBDA_ASSET = path.join(__dirname, "..", "..", "assets", "postlambda", 'index.js.zip');
const PRE_LAMBDA_ASSET = path.join(__dirname, "..", "..", "assets", "prelambda", 'index.js.zip');
const POLL_FILE_PATH = path.join(__dirname, "..", "..", "assets", "s3", 'polling.js');
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

  // Create Role
  const roleArn = await createRole(REGION, ROLE_NAME);
  await logger.process(10000, '%s sealing buzz...');
  console.log('\n');

  // Deploy S3 Bucket + S3 Objects
  const s3ObjectRootDomain = await deployS3(REGION, S3_NAME, S3_ASSET_PATH);

  // Deploy DLQ
  const dlqArn = await deployDlq(REGION, DLQ_NAME);

  // Deploy SQS
  const sqsUrl = await deploySqs(REGION, SQS_NAME, dlqArn);

  // Deploy DynamoDB
  const dbArn = await deployDynamo(REGION, DYNAMO_NAME);

  // Deploy Post Lambda
  const postLambdaArn = await deployPostLambda(REGION, POST_LAMBDA_NAME, sqsUrl, POST_LAMBDA_ASSET, roleArn, DYNAMO_NAME, RATE);

  // Deploy Cloudwatch Event Rules for Post Lambda (CRON)
  await deployCloudwatchEvent(REGION, postLambdaArn, CRON_JOB_NAME);

  // Deploy Pre Lambda
  const preLambdaArn = await deployPreLambda(REGION, PRE_LAMBDA_NAME, sqsUrl, PRE_LAMBDA_ASSET, roleArn, s3ObjectRootDomain);
  
  // Deploy API Gateway + Waiting Room Route
  const {restApiId, stageSealBuzzUrl} = await deployApiGateway(REGION, API_GATEWAY_NAME, preLambdaArn, STAGE_NAME);

  // Deploy Waiting Room Polling Route on API Gateway
  const stagePollingUrl = await deployPollingRoute(restApiId, REGION, API_GATEWAY_NAME, dbArn, roleArn, s3ObjectRootDomain, STAGE_NAME);
  
  // Create and upload poll.js to S3 bucket
  await deployPollingS3Object(REGION, S3_NAME, stagePollingUrl, POLL_FILE_PATH);

  logger.log(stageSealBuzzUrl);
}