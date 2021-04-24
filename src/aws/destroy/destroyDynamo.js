const { DynamoDBClient, DeleteTableCommand } = require("@aws-sdk/client-dynamodb");

const logger = require("../../utils/logger")("dev");

const destroyTable = async (dynamo, tableName) => {
  const params = {
    TableName: tableName,
  };
  
  const command = new DeleteTableCommand(params);

  try {
    await dynamo.send(command);
    logger.debug(`Successfully deleted table: ${tableName}`);
  } catch (err) {
    logger.debugError("Error", err);
  }
}

module.exports = async (region, tableName) => {
  const dynamo = new DynamoDBClient({ region });

  // Destroy table
  await destroyTable(dynamo, tableName);
};
