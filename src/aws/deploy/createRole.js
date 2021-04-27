const {
  IAMClient,
  CreateRoleCommand,
  AttachRolePolicyCommand,
} = require("@aws-sdk/client-iam");
const logger = require("../../utils/logger")("dev");
const retry = require("../../utils/retry");

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

const arnPermissions = [
  "arn:aws:iam::aws:policy/AmazonSQSFullAccess",
  "arn:aws:iam::aws:policy/AmazonS3FullAccess",
  "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs",
  "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
  "arn:aws:iam::aws:policy/AWSLambda_FullAccess",
];

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

const addPermissions = async (iam, roleName) => {
  for (let arnPermission of arnPermissions) {
    await retry(() => attachPolicy(iam, arnPermission, roleName));
  }
};

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

module.exports = async (region, roleName) => {
  // Create an IAM client service object
  const iam = new IAMClient({ region });

  // Create Role
  const roleArn = await createRole(iam, policy, roleName);
  await addPermissions(iam, roleName);
  return roleArn;
};
