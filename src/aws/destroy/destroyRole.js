const {
  IAMClient,
  DetachRolePolicyCommand,
  DeleteRoleCommand
} = require("@aws-sdk/client-iam");
const logger = require("../../utils/logger")("destroy");

const permissions = [
  "arn:aws:iam::aws:policy/AmazonSQSFullAccess",
  "arn:aws:iam::aws:policy/AmazonS3FullAccess",
  "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs",
  "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
  "arn:aws:iam::aws:policy/AWSLambda_FullAccess",
];

const detachPermissions = async (iam, permissions, roleName) => {
  for (let perm of permissions) {
    const command = new DetachRolePolicyCommand({
      PolicyArn: perm,
      RoleName: roleName,
    });

    try {
      await iam.send(command);
      logger.log(`Successfully removed permission ${perm} from ${roleName} role`);
    } catch (err) {
      logger.warning("Error", err);
    }
  }
};

const destroyRole = async (iam, roleName) => {
  const params = {
    RoleName: roleName,
  };
  const command = new DeleteRoleCommand(params);

  try {
    await iam.send(command);
    logger.log(`Successfully deleted IAM role: ${roleName}`);
  } catch (err) {
    logger.warning("Error", err);
  }
}

module.exports = async (region, roleName) => {
  // Create an IAM client service object
  const iam = new IAMClient({ region });

  // Detach all Permissions from Role
  await detachPermissions(iam, permissions, roleName);

  // Destroy Role
  await destroyRole(iam, roleName);
};
