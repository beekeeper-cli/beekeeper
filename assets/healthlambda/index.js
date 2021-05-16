const END_POINT = process.env.END_POINT;
const https = require('https');
const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.REGION });
const dbClient = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const TABLE_NAME = process.env.TABLE_NAME;

function average(tests) {
    let sums = tests.reduce((sum, test) => {
        return sum + test
    }, 0);

    return sums / tests.length
}

function stdDev(tests, mean) {
    let sumOfDiffs = tests.reduce((sqrSum, test) => {
        return sqrSum + (test - mean)**2;
    }, 0);

    return Math.sqrt(sumOfDiffs / (tests.length - 1));
}

function getTime(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>');
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

            let start = Date.now()
            let end = await getTime(END_POINT)

            tests.push(end - start);
        }

    } catch (error) {
        console.error('ERROR:');
        console.error(error);
    } finally {
        return tests;
    }
}

async function runTests() {
    let res = await endpointTest();

    let mean = average(res);
    let dev = stdDev(res, mean);

    console.log({mean, dev});
    return { mean, dev };
}

const writeStats = async (stats) => {
    let params = {
        TableName: TABLE_NAME,
        Item: {
            'stat': {S: 'summary'},
            'average': {N: `${stats.mean}`},
            'stdDev': {N: `${stats.dev}`}
        }
    }    

  try {
    let res = await dbClient.putItem(params).promise();
    return res;
  } catch (e) {
    console.log(e);
  }
};

const getStats = async () => {
  let params = {
      TableName: TABLE_NAME,
      Key: {
          'stat': {S: 'summary'}
      }
  }
    
  try {
    let res = await dbClient.getItem(params).promise();
    return res;
  } catch (e) {
    console.log(e);
  }
}


exports.handler = async () => {
    let oldStats = await getStats();
    
    if (oldStats.Item === undefined) {
        let stats = await runTests().then(data => data);
    
        await writeStats(stats);
        
    } else {
      console.log(oldStats.Item)
    }
};


// TableName: 'CUSTOMER_LIST',
//   Item: {
//     'CUSTOMER_ID' : {N: '001'},
//     'CUSTOMER_NAME' : {S: 'Richard Roe'}
//   }