const AWS = require('aws-sdk');
AWS.config.update({region: process.env.REGION});
const sqsClient = new AWS.SQS({apiVersion: '2012-11-05'});
const SQS_URL = process.env.SQS_URL;
const S3_OBJECT_ROOT_DOMAIN = process.env.S3_OBJECT_ROOT_DOMAIN;
const WAITROOM_ON = process.env.WAITROOM_ON;
const PROTECT_URL = process.env.PROTECT_URL;

const cookieCheck = (response, event) => {
    if (event.headers && !event.headers.cookie) {
        const token = Math.random().toString(16).substring(2);
        response.headers['Set-Cookie'] = 'authToken=' + token + '; SameSite=None; Secure;';
        sendMessageToSQS(token)
    } 
    response.statusCode = '302';
}

// const getWaitTime = async (response) => {
//   let data;
//   var params = {
//     QueueUrl: SQS_URL /* required */,
//     AttributeNames: ["ApproximateNumberOfMessages"],
//   };

//   sqsClient.getQueueAttributes(params, function(err, data) {
//     if (err) console.log(err, err.stack); // an error occurred
//     else     console.log(data);           // successful response
//   });
// };

function sendMessageToSQS(cookieValue) {
  var params = {
    MessageBody: cookieValue,
    QueueUrl: SQS_URL,
    // MessageDeduplicationId: `${Math.random()}`,  // Required for FIFO queues
    // MessageGroupId: `${Math.random()}`, 
  };

  sqsClient.sendMessage(params, function(err, data) {
    if (err) {
      console.log("Error: ", err);
    } else {
      console.log("Success: ", data)
    }
  });
}

exports.handler = async (event, context, callback) => {
    let body;
    let statusCode = '200';
    const headers = {
        'Content-Type': 'application/json',
        'Location': WAITROOM_ON === "true" ? `${S3_OBJECT_ROOT_DOMAIN}/index.html` : PROTECT_URL,
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin': S3_OBJECT_ROOT_DOMAIN,
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*'
    };
    
    let response = {body, statusCode, headers};
    
    try {
        switch (event.httpMethod) {
            case 'GET':
                cookieCheck(response, event);
                break;
            default:
                throw new Error(`Unsupported method "${event.httpMethod}"`);
        }
    } catch (err) {
        statusCode = '400';
        body = err.message;
    } finally {
        response.body = JSON.stringify(response.body);
      }

    callback(null, response);
};