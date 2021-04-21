const { DynamoDBClient, CreateTableCommand } = require("@aws-sdk/client-dynamodb");
const logger = require('../../utils/logger')('commands:deployDynamo');

const createDynamo = async (dynamodb, dynamoName) => {
  const params = {
    AttributeDefinitions: [{
      AttributeName: "usertoken",
      AttributeType: "S"
    }],
    KeySchema: [{
      AttributeName: "usertoken",
      KeyType: "HASH"
    }],
    TableName: dynamoName,
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  }
  const command = new CreateTableCommand(params);

  try {
    const { TableDescription } = await dynamodb.send(command);
    logger.log(`Successfully created DynamoDB table: ${dynamoName}`);
    return TableDescription.TableArn;
  } catch (err) {
    logger.warning("Error", err);
  };
}

module.exports = async (region, dynamoName) => {
  // Create an DDB client service object
  const dynamodb = new DynamoDBClient({ region });

  // Create DynamoDB
  const tableArn = await createDynamo(dynamodb, dynamoName);
  // need to find the arn from this object
  return tableArn
};
