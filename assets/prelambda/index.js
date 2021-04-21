const AWS = require('aws-sdk');
AWS.config.update({region: process.env.REGION});
const sqsClient = new AWS.SQS({apiVersion: '2012-11-05'});
const SQS_URL = process.env.SQS_URL;
const BUCKET_URL = process.env.BUCKET_URL;

const cookieCheck = (response, event) => {
    if (event.headers && !event.headers.cookie) {
        const token = Math.random().toString(16).substring(2);
        response.headers['Set-Cookie'] = 'authToken=' + token + '; SameSite=None; Secure;';
        sendMessageToSQS(token)
    } 
    response.statusCode = '302';
}

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
        'Location': `${BUCKET_URL}index.html`,
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin': BUCKET_URL,
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