const {
  IAMClient,
  CreateRoleCommand,
  AttachRolePolicyCommand,
} = require("@aws-sdk/client-iam");
const logger = require("../../utils/logger")("commands:createRole");

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

const permissions = [
  "arn:aws:iam::aws:policy/AmazonSQSFullAccess",
  "arn:aws:iam::aws:policy/AmazonS3FullAccess",
  "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs",
  "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
  "arn:aws:iam::aws:policy/AWSLambda_FullAccess",
];

const addPermissions = async (iam, name) => {
  for (let perm of permissions) {
    const command = new AttachRolePolicyCommand({
      PolicyArn: perm,
      RoleName: name,
    });

    try {
      await iam.send(command);
      logger.log(`Successfully added permission: ${perm}`);
    } catch (err) {
      logger.log("Error", err);
    }
  }
};

const createRole = async (iam, policyDoc, name) => {
  const params = {
    RoleName: name,
    AssumeRolePolicyDocument: JSON.stringify(policyDoc),
  };
  const command = new CreateRoleCommand(params);

  try {
    let data = await iam.send(command);
    logger.log(`Successfully created IAM role: ${data.Role.Arn}`);
    console.log(data.Role.Arn);
    return data.Role.Arn;
  } catch (err) {
    logger.log("Error", err);
  }
};

module.exports = async (region, name) => {
  // Create an IAM client service object
  const iam = new IAMClient({ region });

  // Create Role
  const newRoleArn = await createRole(iam, policy, name); // arn?
  await addPermissions(iam, name);
  return newRoleArn;
};
