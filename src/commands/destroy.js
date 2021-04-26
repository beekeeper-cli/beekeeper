const path = require("path");
const logger = require("../utils/logger")("dev");
const { readFile } = require("../utils/utilities");
const chalk = require("chalk");
const ora = require("ora");

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
  const spinner = ora();
  let warn = false;

  logger.highlight('🐝  Destroying waiting room infrastructure');
  console.log("")
  
  try {
    spinner.start("Destroying IAM role")
    await destroyRole(REGION, ROLE_NAME);
    spinner.succeed("Successfully destroyed IAM role")
  } catch (err) {
    warn = true;
    spinner.warn("Warning: (IAM role) " + err.message.split(":")[0])
  }

  try {
    spinner.start("Destroying post-lambda")
    await destroyLambda(REGION, POST_LAMBDA_NAME);
    spinner.succeed("Successfully destroyed post-lambda")
  } catch (err) {
    warn = true;
    spinner.warn("Warning: (post-lambda) " + err.message.split(":")[0])
  }

  try {
    spinner.start("Destroying pre-lambda")
    await destroyLambda(REGION, PRE_LAMBDA_NAME);
    spinner.succeed("Successfully destroyed pre-lambda")
  } catch (err) {
    warn = true;
    spinner.warn("Warning: (pre-lambda) " + err.message.split(":")[0])
  }

  try {
    spinner.start("Destroying DLQ")
    await destroySQS(REGION, DLQ_NAME);
    spinner.succeed("Successfully destroyed DLQ")
  } catch (err) {
    warn = true;
    spinner.warn("Warning: (DLQ) " + err.message.split(":")[0])
  }

  try {
    spinner.start("Destroying SQS")
    await destroySQS(REGION, SQS_NAME);
    spinner.succeed("Successfully destroyed SQS")
  } catch (err) {
    warn = true;
    spinner.warn("Warning: (SQS) " + err.message.split(":")[0])
  }

  try {
    spinner.start("Destroying DynamoDB")
    await destroyDynamo(REGION, DYNAMO_NAME);
    spinner.succeed("Successfully destroyed DynamoDB")
  } catch (err) {
    warn = true;
    spinner.warn("Warning: (DynamoDB) " + err.message.split(":")[0])
  }

  try {
    spinner.start("Destroying Cloudwatch Event")
    await destroyCloudwatchEvent(REGION, CRON_JOB_NAME);
    spinner.succeed("Successfully destroyed Cloudwatch Event")
  } catch (err) {
    warn = true;
    spinner.warn("Warning: (Cloudwatch Event) " + err.message.split(":")[0])
  }

  try {
    spinner.start("Destroying S3 Bucket")
    await destroyS3(REGION, S3_NAME);
    spinner.succeed("Successfully destroyed S3 Bucket")
  } catch (err) {
    warn = true;
    spinner.warn("Warning: (S3 Bucket) " + err.message.split(":")[0])
  }

  try {
    spinner.start("Destroying API Gateway")
    await destroyApiGateway(REGION, API_GATEWAY_NAME);
    spinner.succeed("Successfully destroyed API Gateway")
  } catch (err) {
    warn = true;
    spinner.warn("Warning: (API Gateway) " + err.message.split(":")[0])
  }

  console.log("")
  
  if (warn) {
    console.log(`Note: It's normal to see "${chalk.yellow.bold("⚠")} Warning" if that piece of the infrastructure has not been deployed yet.`)
    console.log("")
  }
  logger.highlight(`${chalk.green.bold("✔")} Successfully destroyed waiting room infrastructure`);
};
