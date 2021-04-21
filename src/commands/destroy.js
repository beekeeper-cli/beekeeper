const logger = require('../utils/logger')('commands:destroy');
const destroyRole = require('../aws/destroy/destroyRole');
const destroyLambda = require('../aws/destroy/destroyLambda');
const destroySQS = require('../aws/destroy/destroySQS');
const destroyDynamo = require('../aws/destroy/destroyDynamo');
const destroyCloudwatchEvent = require('../aws/destroy/destroyCloudwatchEvent');
const destroyS3 = require('../aws/destroy/destroyS3');
const destroyApi = require('../aws/destroy/destroyApiGateway');
const destroyApiGateway = require('../aws/destroy/destroyApiGateway');

const REGION = "us-east-2";
const S3_NAME = "wr-teamsix-s3"
const DLQ_NAME = "wr-teamsix-dlq"
const SQS_NAME = "wr-teamsix-sqs"
const DYNAMO_NAME = "wr-teamsix-ddb"
const API_GATEWAY_NAME = "wr-teamsix-apigateway"
const POST_LAMBDA_NAME = 'wr-teamsix-postlambda'
const PRE_LAMBDA_NAME = 'wr-teamsix-prelambda'
const ROLE_NAME = 'wr-teamsix-master-role'
const CRON_JOB_NAME = 'wr-cronjob-cloudwatchevent';

module.exports = async () => {
  logger.highlight('Destroying waiting room infrastructure');
  // await destroyRole(REGION, ROLE_NAME);
  // await destroyLambda(REGION, POST_LAMBDA_NAME);
  // await destroyLambda(REGION, PRE_LAMBDA_NAME);
  // await destroySQS(REGION, DLQ_NAME);
  // await destroySQS(REGION, SQS_NAME);
  // await destroyDynamo(REGION, DYNAMO_NAME);
  // await destroyCloudwatchEvent(REGION, CRON_JOB_NAME);
  // await destroyS3(REGION, S3_NAME);
  await destroyApiGateway(REGION, API_GATEWAY_NAME);
  // Add destroy api gateway
}