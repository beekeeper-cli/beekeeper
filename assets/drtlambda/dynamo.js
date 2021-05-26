/**
 * Exports functions for interacting with the Beekeeper DynamoDB.
 * @module dynamo
 */

const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.REGION });
const dbClient = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
const TABLE_NAME = process.env.TABLE_NAME;

/**
 * Writes a stats object to the DynamoDB
 * @param {{mean, stdDev}} stats 
 * @returns {Object} response from DynamoDB
 */
const writeStats = async (stats) => {
  let params = {
    TableName: TABLE_NAME,
    Item: {
      stat: { S: "summary" },
      average: { N: `${stats.mean}` },
      stdDev: { N: `${stats.dev}` },
    },
  };

  try {
    let res = await dbClient.putItem(params).promise();
    return res;
  } catch (e) {
    console.log(e);
  }
};

/**
 * Gets the stats object from the DynamoDB
 * @returns {Object} Returns a DynamoDB Item
 */
const getStats = async () => {
  let params = {
    TableName: TABLE_NAME,
    Key: {
      stat: { S: "summary" },
    },
  };

  try {
    let res = await dbClient.getItem(params).promise();
    return res;
  } catch (e) {
    console.log(e);
  }
};

/**
 * Gets the tune object from the DynamoDB
 * @returns {Object}
 */
const getTune = async () => {
  let params = {
    TableName: TABLE_NAME,
    Key: {
      stat: { S: "tune" },
    },
  };

  try {
    let res = await dbClient.getItem(params).promise();
    return res;
  } catch (e) {
    console.log(e);
  }
};


/**
 * Writes a tune to the DynamoDB
 * @param {{initial, current, last}} tuneStats 
 * @returns response from DynamoDB
 */
const writeTune = async (tuneStats) => {
  let params = {
    TableName: TABLE_NAME,
    Item: {
      stat: { S: "tune" },
      initial: { N: `${tuneStats.initial}` },
      current: { N: `${tuneStats.current}` },
      last: { N: `${tuneStats.last}`}
    },
  };

  try {
    let res = await dbClient.putItem(params).promise();
    return res;
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  writeStats,
  getStats,
  getTune,
  writeTune
}