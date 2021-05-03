/**
 * Exports an async function that creates one "kitchen sink" role for all AWS services to use. This module first creates an IAMClient, then creates a role, and finally adds permissions/policies (used as synonyms herein) with the help of a the helper function retry().
 * @module createRole
 */
const {
  IAMClient,
  CreateRoleCommand,
  AttachRolePolicyCommand,
} = require("@aws-sdk/client-iam");
const logger = require("../../utils/logger")("dev");
const retry = require("../../utils/retry");

/**
 * This constant is the general policy document. It is used by createRole.
 */
const policy = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Principal: {
        Service: [
          "s3.amazonaws.com",
          "sqs.amazonaws.com",
          "apigateway.amazonaws.com",
          "dynamodb.amazonaws.com",
          "lambda.amazonaws.com",
        ],
      },
      Action: "sts:AssumeRole",
    },
  ],
};

/**
 * This constant is an array containing all the specific policies our infrastructure uses. We are creating one role that will have all of these policies attached to it.
 */
const arnPermissions = [
  "arn:aws:iam::aws:policy/AmazonSQSFullAccess",
  "arn:aws:iam::aws:policy/AmazonS3FullAccess",
  "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs",
  "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
  "arn:aws:iam::aws:policy/AWSLambda_FullAccess",
];

/**
 * We must create a role first before we can add specific service-level policies to it.
 * @param {IAMClient} iam A IAM client: new IAMClient({ region })
 * @param {Object} policyDoc A constant defining the policy.
 * @param {String} roleName A constant made in deploy.js: `beekeeper-${PROFILE_NAME}-master-role`
 * @returns {String} data.Role.Arn This is an Amazon Resource Number uniquely identifying the role.
 */
const createRole = async (iam, policyDoc, roleName) => {
  const params = {
    RoleName: roleName,
    AssumeRolePolicyDocument: JSON.stringify(policyDoc),
  };
  const command = new CreateRoleCommand(params);

  try {
    let data = await iam.send(command);
    logger.debugSuccess(`Successfully created IAM role: ${data.Role.Arn}`);
    return data.Role.Arn;
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * This function adds all the permissions from the arnPermissions array to the role we created. Adding multiple permissions in succession sometimes causes throttling by AWS, so we use a helper function retry(); if adding a permission fails, it waits more time and retries again. This function only iterates the arnPermissions array and uses the helper retry(); the concern of actually attaching the policy/permission to the role is left to attachPolicy(). Policy/permission are used interchangeably here.
 * @param {IAMClient} iam 
 * @param {String} roleName A constant made in deploy.js: `beekeeper-${PROFILE_NAME}-master-role`
 */
const addPermissions = async (iam, roleName) => {
  for (let arnPermission of arnPermissions) {
    await retry(() => attachPolicy(iam, arnPermission, roleName));
  }
};

/**
 * This function actually attaches a permission/policy to the role.
 * @param {IAMClient} iam A IAM client: new IAMClient({ region })
 * @param {String} arnPermission One of the permissions from the arnPermissions constant.
 * @param {String} roleName A constant made in deploy.js: `beekeeper-${PROFILE_NAME}-master-role`
 * @returns {Object} An object with properties the retry() helper function is expecting.
 */
const attachPolicy = async (iam, arnPermission, roleName) => {
  const command = new AttachRolePolicyCommand({
    PolicyArn: arnPermission,
    RoleName: roleName,
  });

  try {
    await iam.send(command);
    logger.debugSuccess(`Successfully added permission: ${arnPermission}`);
    return { status: "Success", response: ""}
  } catch (err) {
    logger.debugError("Error", err);
    return { status: err.Code, response: ""}
  }
}

/**
 * Exports createRole.
 * @param {String} region A constant destructured from the CLI user's answers in deploy.js. Like "us-east-2".
 * @param {String} roleName Made in deploy.js: `beekeeper-${PROFILE_NAME}-master-role` 
 * @returns {String} A constant Amazon Resource Number uniquely identifying the role. It is needed by many other modules called in deploy.js because AWS services often need to be associated with a role containing their permissions.
 */
module.exports = async (region, roleName) => {
  // Create an IAM client service object
  const iam = new IAMClient({ region });

  // Create Role
  const roleArn = await createRole(iam, policy, roleName);
  await addPermissions(iam, roleName);
  return roleArn;
};
