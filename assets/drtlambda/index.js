const END_POINT = process.env.END_POINT;
const https = require("https");
const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.REGION });
const {average, stdDev} = require('./stats');
const tuneRate = require('./tune');
const { getStats, writeStats } = require('./dynamo');

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

// now to program the "usual" way
// all you need to do is use async functions and await
// for functions returning promises
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

  // run an endpoint test and if the average is greater
  // than (average + 3x dev) of baseline perform a throttle

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

/*
Need some logic to determine if lambda has been throttled in the past
Could do this with another write to the database or with altering the database
Maybe need a way to throttle up as well after rate has been throttled down

*/