const { SQSClient, SendMessageBatchCommand } = require("@aws-sdk/client-sqs");
var QUEUE_URL = 'https://sqs.us-east-2.amazonaws.com/212700019935/v1-wait-room.fifo';
var sqs = new SQSClient({region : 'us-east-2'});

const cookieCheck = async (response, event) => {
    if (event.headers && !event.headers.cookie) {
        const token = Math.random().toString(16).substring(2);
        response.headers['Set-Cookie'] = 'authToken=' + token + '; SameSite=None; Secure;';
        try {
          await sendMessageToSQS(token)
        } catch (err) {
          console.log("Error", err)
        }
    } 
    response.statusCode = '302';
}

async function sendMessageToSQS(cookieValue) {
  var params = {
    MessageBody: cookieValue,
    QueueUrl: QUEUE_URL,
    MessageDeduplicationId: `${Math.random()}`,  // Required for FIFO queues
    MessageGroupId: `${Math.random()}`, 
  };
  const command = new SendMessageBatchCommand(params);

  try {
    await sqs.sendMessage(command);
    console.log("Successfully sent message to SQS");
  } catch (err) {
    console.log("Error", err);
  }
}

exports.handler = async (event, context, callback) => {
    let body;
    let statusCode = '200';
    const headers = {
        'Content-Type': 'application/json',
        'Location': 'https://v1-waiting-room.s3.us-east-2.amazonaws.com/index.html',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin': 'https://v1-waiting-room.s3.us-east-2.amazonaws.com',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*'
    };
    
    let response = {body, statusCode, headers};
    
    try {
        switch (event.httpMethod) {
            case 'GET':
                // statusCode = '302';
                console.log('before cookiecheck')
                await cookieCheck(response, event);
                console.log('after cookiecheck')
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
      console.log('end')

      callback(null, response);
};