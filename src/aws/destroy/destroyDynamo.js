const { DynamoDBClient, DeleteTableCommand } = require("@aws-sdk/client-dynamodb");

const logger = require("../../utils/logger")("destroyDynamo");

const destroyTable = async (dynamo, tableName) => {
  const params = {
    TableName: tableName,
  };
  
  const command = new DeleteTableCommand(params);

  try {
    await dynamo.send(command);
    logger.log(`Successfully deleted table: ${tableName}`);
  } catch (err) {
    logger.warning("Error", err);
  }
}

module.exports = async (region, tableName) => {
  const dynamo = new DynamoDBClient({ region });

  // Destroy table
  await destroyTable(dynamo, tableName);
};
