const path = require("path");
const logger = require('../utils/logger')('dev');
const { readFile, validateInitRan, validateProfileName } = require("../utils/utilities");
const chalk = require("chalk");
const ora = require("ora");

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
const deployClientCheckRoute = require("../aws/deploy/deployClientCheckRoute");
const deployPollingS3Object = require("../aws/deploy/deployPollingS3Object");
const addPostLambdaEventPermission = require("../aws/deploy/addPostLambdaEventPermission");

const ANSWERS_FILE_PATH = path.join(__dirname, "..", "config", "user-answers.json");
const S3_ASSET_PATH = path.join(__dirname, "..", "..", "assets", "s3");
const POST_LAMBDA_ASSET = path.join(__dirname, "..", "..", "assets", "postlambda", 'index.js.zip');
const PRE_LAMBDA_ASSET = path.join(__dirname, "..", "..", "assets", "prelambda", 'index.js.zip');
const POLL_FILE_PATH = path.join(__dirname, "..", "..", "assets", "s3", 'polling.js');

module.exports = async (profileName) => {
  const initRan = await validateInitRan(ANSWERS_FILE_PATH);
  if (!initRan) return;
  
  const profiles = JSON.parse(await readFile(ANSWERS_FILE_PATH));
  const validProfileName = validateProfileName(profileName, profiles, "deploy");
  if (!validProfileName) return;

  const {[profileName] : { PROFILE_NAME, WAITING_ROOM_NAME, REGION, PROTECT_URL, RATE }} = profiles;
  const S3_NAME = `beekeeper-${PROFILE_NAME}-s3`
  const DLQ_NAME = `beekeeper-${PROFILE_NAME}-dlq`
  const SQS_NAME = `beekeeper-${PROFILE_NAME}-sqs`
  const DYNAMO_NAME = `beekeeper-${PROFILE_NAME}-ddb`
  const API_GATEWAY_NAME = `beekeeper-${PROFILE_NAME}-apigateway`
  const POST_LAMBDA_NAME = `beekeeper-${PROFILE_NAME}-postlambda`
  const PRE_LAMBDA_NAME = `beekeeper-${PROFILE_NAME}-prelambda`
  const ROLE_NAME = `beekeeper-${PROFILE_NAME}-master-role`
  const CRON_JOB_NAME = `beekeeper-${PROFILE_NAME}-cloudwatcheventcron`
  const STAGE_NAME = `prod`;
  const spinner = ora();

  logger.highlight('🐝  Deploying waiting room infrastructure');
  console.log("")

  // Create Role
  let roleArn;
  try {
    spinner.start("Creating IAM role")
    roleArn = await createRole(REGION, ROLE_NAME);
    spinner.succeed("Successfully created IAM role")
  } catch (err) {
    spinner.fail("Failed to create IAM role")
    logger.failDeploy();
    return;
  }

  // Deploy S3 Bucket + S3 Objects
  let s3ObjectRootDomain;
  try {
    spinner.start("Deploying S3 bucket")
    s3ObjectRootDomain = await deployS3(REGION, S3_NAME, S3_ASSET_PATH);
    spinner.succeed("Successfully deployed S3 bucket")
  } catch (err) {
    spinner.fail("Failed to deploy S3 bucket")
    logger.failDeploy();
    return;
  }

  // Deploy DLQ
  let dlqArn
  try {
    spinner.start("Deploying DLQ")
    dlqArn = await deployDlq(REGION, DLQ_NAME);
    spinner.succeed("Successfully deployed DLQ")
  } catch (err) {
    spinner.fail("Failed to deployed DLQ")
    logger.failDeploy();
    return;
  }

  // Deploy SQS
  let sqsUrl;
  try {
    spinner.start("Deploying SQS")
    sqsUrl = await deploySqs(REGION, SQS_NAME, dlqArn);
    spinner.succeed("Successfully deployed SQS")
  } catch (err) {
    spinner.fail("Failed to deployed SQS")
    logger.failDeploy();
    return;
  }

  // Deploy DynamoDB
  let dbArn;
  try {
    spinner.start("Deploying DynamoDB")
    dbArn = await deployDynamo(REGION, DYNAMO_NAME);
    spinner.succeed("Successfully deployed DynamoDB")
  } catch (err) {
    spinner.fail("Failed to deployed DynamoDB")
    logger.failDeploy();
    return;
  }

  // Deploy Post Lambda
  let postLambdaArn;
  let eventArn;
  try {
    spinner.start("Deploying post-lambda")
    postLambdaArn = await deployPostLambda(REGION, POST_LAMBDA_NAME, sqsUrl, POST_LAMBDA_ASSET, roleArn, DYNAMO_NAME, RATE);

    // Deploy Cloudwatch Event Rules for Post Lambda (CRON)
    eventArn = await deployCloudwatchEvent(REGION, postLambdaArn, CRON_JOB_NAME);
    
    // Add event permission
    await addPostLambdaEventPermission(REGION, POST_LAMBDA_NAME, eventArn, CRON_JOB_NAME, postLambdaArn);

    spinner.succeed("Successfully deployed post-lambda")
  } catch (err) {
    spinner.fail("Failed to deployed post-lambda")
    logger.failDeploy();
    return;
  }

  // Deploy Pre Lambda
  let preLambdaArn;
  try {
    spinner.start("Deploying pre-lambda")
    preLambdaArn = await deployPreLambda(REGION, PRE_LAMBDA_NAME, sqsUrl, PRE_LAMBDA_ASSET, roleArn, s3ObjectRootDomain, PROTECT_URL);

    spinner.succeed("Successfully deployed pre-lambda")
  } catch (err) {
    spinner.fail("Failed to deployed pre-lambda")
    logger.failDeploy();
    return;
  }

  // Deploy API Gateway + Waiting Room Route
  let restApiId, stageBeekeeperUrl;
  let stagePollingUrl;
  let clientCheckUrl;
  try {
    spinner.start("Deploying API Gateway")
    let result = await deployApiGateway(REGION, API_GATEWAY_NAME, preLambdaArn, STAGE_NAME);
    restApiId = result.restApiId;
    stageBeekeeperUrl = result.stageBeekeeperUrl;

    // Deploy Waiting Room Polling Route on API Gateway
    stagePollingUrl = await deployPollingRoute(restApiId, REGION, API_GATEWAY_NAME, DYNAMO_NAME, roleArn, s3ObjectRootDomain, STAGE_NAME, PROTECT_URL);

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(5000);

    // Deploy Client Check Route on API Gateway
    clientCheckUrl = await deployClientCheckRoute(restApiId, REGION, API_GATEWAY_NAME, DYNAMO_NAME, roleArn, STAGE_NAME, PROTECT_URL);
    
    // Create and upload poll.js to S3 bucket
    await deployPollingS3Object(REGION, S3_NAME, stagePollingUrl, POLL_FILE_PATH, WAITING_ROOM_NAME, RATE);
    
    spinner.succeed("Successfully deployed API Gateway")
    console.log("");
    logger.highlight(`${chalk.green.bold("✔")} Successfully deployed waiting room infrastructure`);
    console.log("");
    console.log(`Here's your waiting room URL: ${chalk.yellow.bold(stageBeekeeperUrl)}`);
    console.log(`Here's the client check endpoint: ${chalk.yellow.bold(clientCheckUrl)}`);
  } catch (err) {
    spinner.fail("Failed to deployed API Gateway")
    logger.failDeploy();
    return;
  }
}