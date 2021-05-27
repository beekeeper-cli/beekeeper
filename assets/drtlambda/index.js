/**
 * @module handler
 * The handler function for the DRT lambda
 */

const END_POINT = process.env.END_POINT;
const https = require("https");
const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.REGION });
const {average, stdDev} = require('./stats');
const tuneRate = require('./tune');
const { getStats, writeStats } = require('./dynamo');

/**
 * Returns a promise that resolves to a date if the GET request inside is successful.
 * @param {*} url The url of the client endpoint
 * @returns {Promise}
 */
function getTime(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode != 200) {
        reject("Invalid status code <" + response.statusCode + ">");
      }
      resolve(Date.now());
    });
  });
}

/**
 * Loops 20 times, running getTime, and returns an array of response times.
 * @returns {Array} Returns an array of integers.
 */
async function endpointTest() {
  let tests = [];

  try {
    for (let idx = 0; idx < 20; idx++) {
      let start = Date.now();
      let end = await getTime(END_POINT);

      tests.push(end - start);
    }
  } catch (error) {
    console.error("ERROR:");
    console.error(error);
  } finally {
    return tests;
  }
}

/**
 * Calculates statistics on endpoint test and returns results in an object
 * @returns {Object}
 */
async function runTests() {
  let res = await endpointTest();

  let mean = average(res);
  let dev = stdDev(res, mean);

  return { mean, dev };
}

function passesCheck(stats, healthCheck) {
  let upperLimit = Number(stats.average.N) + 3 * Number(stats.stdDev.N);

  return healthCheck.mean < upperLimit;
}

exports.handler = async () => {
  let oldStats = await getStats();

  if (oldStats.Item === undefined) {
    let stats = await runTests().then((data) => data);

    await writeStats(stats);
  } else {
    let healthCheck = await runTests();
    let passed = passesCheck(oldStats.Item, healthCheck);
    console.log("healthCheck ", healthCheck);
    console.log("passed ", passed);
    tuneRate(passed);
  }
};
