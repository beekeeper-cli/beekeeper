const path = require("path");
const logger = require("../utils/logger")("dev");
const { readFile } = require("../utils/utilities");

const destroyRole = require("../aws/destroy/destroyRole");
const destroyLambda = require("../aws/destroy/destroyLambda");
const destroySQS = require("../aws/destroy/destroySQS");
const destroyDynamo = require("../aws/destroy/destroyDynamo");
const destroyCloudwatchEvent = require("../aws/destroy/destroyCloudwatchEvent");
const destroyS3 = require("../aws/destroy/destroyS3");
const destroyApiGateway = require("../aws/destroy/destroyApiGateway");

const ANSWERS_FILE_PATH = path.join(
  __dirname,
  "..",
  "config",
  "user-answers.json"
);

module.exports = async () => {
  const { WAITING_ROOM_NAME, REGION } = JSON.parse(await readFile(ANSWERS_FILE_PATH));
  const S3_NAME = `wr-${WAITING_ROOM_NAME}-s3`
  const DLQ_NAME = `wr-${WAITING_ROOM_NAME}-dlq`
  const SQS_NAME = `wr-${WAITING_ROOM_NAME}-sqs`
  const DYNAMO_NAME = `wr-${WAITING_ROOM_NAME}-ddb`
  const API_GATEWAY_NAME = `wr-${WAITING_ROOM_NAME}-apigateway`
  const POST_LAMBDA_NAME = `wr-${WAITING_ROOM_NAME}-postlambda`
  const PRE_LAMBDA_NAME = `wr-${WAITING_ROOM_NAME}-prelambda`
  const ROLE_NAME = `wr-${WAITING_ROOM_NAME}-master-role`
  const CRON_JOB_NAME = `wr-${WAITING_ROOM_NAME}-cloudwatcheventcron`

  logger.highlight('🐝  Destroying waiting room infrastructure');
  await destroyRole(REGION, ROLE_NAME);
  await destroyLambda(REGION, POST_LAMBDA_NAME);
  await destroyLambda(REGION, PRE_LAMBDA_NAME);
  await destroySQS(REGION, DLQ_NAME);
  await destroySQS(REGION, SQS_NAME);
  await destroyDynamo(REGION, DYNAMO_NAME);
  await destroyCloudwatchEvent(REGION, CRON_JOB_NAME);
  await destroyS3(REGION, S3_NAME);
  await destroyApiGateway(REGION, API_GATEWAY_NAME);
};
