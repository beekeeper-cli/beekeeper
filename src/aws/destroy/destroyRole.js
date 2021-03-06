/**
 * Exports an async function that removes a IAM Role
 * @module destroyRole
 */
const {
  IAMClient,
  DetachRolePolicyCommand,
  DeleteRoleCommand
} = require("@aws-sdk/client-iam");
const logger = require("../../utils/logger")("dev");
const retry = require("../../utils/retry");

const permissions = [
  "arn:aws:iam::aws:policy/AmazonSQSFullAccess",
  "arn:aws:iam::aws:policy/AmazonS3FullAccess",
  "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs",
  "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
  "arn:aws:iam::aws:policy/AWSLambda_FullAccess",
];

/**
 * Removes a permission from a IAM role
 * @param {IAMClient} iam This is the IAM client
 * @param {String} perm This is the policy arn
 * @param {String} roleName This is the name of the IAM role
 * @returns {Object} This is the object representing whether the removal was successful
 * @throws Will throw an error if IAM client fails to execute its command
 */
const detachPolicy = async (iam, perm, roleName) => {
  const command = new DetachRolePolicyCommand({
    PolicyArn: perm,
    RoleName: roleName,
  });
  
  try {
    await iam.send(command);
    logger.debugSuccess(`Successfully removed permission ${perm} from ${roleName} role`);
    return { status: "Success", response: "" }
  } catch (err) {
    logger.debugError("Error", err);
    return { status: err.Code, response: ""}
  }
}

/**
 * Removes multiple permissions/policies from a IAM role
 * @param {IAMClient} iam This is the IAM client
 * @param {String} permissions This is the policy arn
 * @param {String} roleName This is the name of the IAM role
 */
const detachPermissions = async (iam, permissions, roleName) => {
  for (let perm of permissions) {
    await retry(() => detachPolicy(iam, perm, roleName));
  }
};

/**
 * Deletes a IAM role
 * @param {IAMClient} iam This is the IAM client
 * @param {String} roleName This is the name of the IAM role
 * @throws Will throw an error if IAM client fails to execute its command
 */
const destroyRole = async (iam, roleName) => {
  const params = {
    RoleName: roleName,
  };
  const command = new DeleteRoleCommand(params);

  try {
    await iam.send(command);
    logger.debugSuccess(`Successfully deleted IAM role: ${roleName}`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
}

/**
 * Exports destroyRole
 * @param {String} region This is the region of where this AWS service is deployed
 * @param {String} roleName This is the name of the IAM role
 */
module.exports = async (region, roleName) => {
  const iam = new IAMClient({ region });

  await detachPermissions(iam, permissions, roleName);

  await destroyRole(iam, roleName);
};
