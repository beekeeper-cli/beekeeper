/**
 * Exports an async function that tears down the Dynamo DB
 * @module destroyDynamo
 */
const { DynamoDBClient, DeleteTableCommand } = require("@aws-sdk/client-dynamodb");

const logger = require("../../utils/logger")("dev");

/**
 * Tears down the Dynamo DB
 * @param {DynamoDBClient} dynamo This is the DynamoDB client
 * @param {String} tableName This is the name of the DynamoDB table
 * Will throw an error if DynamoDB client fails to execute its command
 */
const destroyTable = async (dynamo, tableName) => {
  const params = {
    TableName: tableName,
  };
  
  const command = new DeleteTableCommand(params);

  try {
    await dynamo.send(command);
    logger.debugSuccess(`Successfully deleted table: ${tableName}`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
}

/**
 * Exports destroyDynamo
 * @param {String} region This is the region of where this AWS service is deployed
 * @param {String} tableName This is the name of the DynamoDB table
 */
module.exports = async (region, tableName) => {
  const dynamo = new DynamoDBClient({ region });

  await destroyTable(dynamo, tableName);
};
