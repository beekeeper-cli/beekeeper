/**
 * Exports an async function that deploys the DynamoDB database
 * @module deployDynamo
 */
 const {
  DynamoDBClient,
  CreateTableCommand,
} = require("@aws-sdk/client-dynamodb");
const logger = require("../../utils/logger")("dev");

/**
 * Function that creates the DynamoDB with one attribute, a string "usertoken" and leaves the provisioned Throupt as default at 5 for both Read and Write capacity units.
 * @param {DynamoDBClient} dynamodb Looks like 'new DynamoDBClient({ region })`
 * @param {String} dynamoName Constant initialized as `beekeeper-${PROFILE_NAME}-ddb`
 * @returns {String} Returns the ARN of a TableDescription
 */
const createDynamo = async (dynamodb, dynamoName) => {
  const params = {
    AttributeDefinitions: [
      {
        AttributeName: "stat",
        AttributeType: "S",
      },
    ],
    KeySchema: [
      {
        AttributeName: "stat",
        KeyType: "HASH",
      },
    ],
    TableName: dynamoName,
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };
  const command = new CreateTableCommand(params);

  try {
    const { TableDescription } = await dynamodb.send(command);
    logger.debugSuccess(`Successfully created DynamoDB table: ${dynamoName}`);
    return TableDescription.TableArn;
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Exports deployDynamo
 * @param {String} region A constant destructured from the CLI user's answers in `deploy.js`. Like "us-east-2".
 * @param {String} dynamoName Constant initialized as `beekeeper-${PROFILE_NAME}-ddb`
 * @returns {String} Returns the ARN of the table for the DynamoDB
 */
module.exports = async (region, dynamoName) => {
  // Create an DDB client service object
  const dynamodb = new DynamoDBClient({ region });

  // Create DynamoDB
  const tableArn = await createDynamo(dynamodb, dynamoName);

  return tableArn;
};
