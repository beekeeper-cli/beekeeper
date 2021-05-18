const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.REGION });
const dbClient = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
const TABLE_NAME = process.env.TABLE_NAME;

// writes baseline stats to database
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

// gets basesline states from db
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

// get throttle stats to db
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


// write throttle stats from db
const writeTune = async (tuneStats) => {
  let params = {
    TableName: TABLE_NAME,
    Item: {
      stat: { S: "tune" },
      initial: { N: `${tuneStats.initial}` },
      current: { N: `${tuneStats.current}` },
      last: { N: `${tuneStats.now}`}
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