const AWS = require("aws-sdk");
AWS.config.update({region: process.env.REGION});
const docClient = new AWS.DynamoDB.DocumentClient();
const sqsClient = new AWS.SQS({apiVersion: '2012-11-05'});
const TABLE_NAME = process.env.TABLE_NAME;
const SQS_URL = process.env.SQS_URL;

// use later maybe
//ReceiveRequestAttemptId: `${Math.random().toString(16).substring(2)}`,
const queueParams = {
  QueueUrl: SQS_URL, /* required */
  AttributeNames: [ 'All' ],
  MaxNumberOfMessages: '10',
  MessageAttributeNames: [ 'body' ],
  VisibilityTimeout: '10',
}

const deleteParams = {
  Entries: [ /* an array of messages */ ],
  QueueUrl: SQS_URL /* required */
};

exports.handler = async function (event) {
  // let messages //= event.Records;
  let data;
  let sqsData;

  try {
    sqsData = await sqsClient.receiveMessage(queueParams).promise();
    console.log('sqsData', sqsData);
  } catch (error) {
    console.log(error, sqsData);
  }

  let users = [];
  let entries = [];

  if (!sqsData.Messages) {
    console.log('nothing yet')
    return;
  }

  sqsData.Messages.forEach((message) => {
    entries.push({
      Id: message.MessageId,
      ReceiptHandle: message.ReceiptHandle
    });

    users.push({
      PutRequest: {
        Item: {
          date: Date.now(),
          usertoken: message.Body,
          allow: true
        },
      },
    });
  });

  deleteParams.Entries = entries;
  console.log(deleteParams);

  let params = {
    RequestItems: {
      [TABLE_NAME]: users,
    },
  };

  try {
    data = await docClient.batchWrite(params).promise();

    let deleted = await sqsClient.deleteMessageBatch(deleteParams).promise();

    return data;
  } catch (e) {
    console.log(e, data);
    return e;
  }
};



