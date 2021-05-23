const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.REGION });
const docClient = new AWS.DynamoDB.DocumentClient();
const sqsClient = new AWS.SQS({ apiVersion: "2012-11-05" });
const TABLE_NAME = process.env.TABLE_NAME;
const SQS_URL = process.env.SQS_URL;
// const RATE = Number(process.env.RATE);

// use later maybe
//ReceiveRequestAttemptId: `${Math.random().toString(16).substring(2)}`,
const queueParams = {
  QueueUrl: SQS_URL /* required */,
  AttributeNames: ["All"],
  MaxNumberOfMessages: "10",
  MessageAttributeNames: ["body"],
  VisibilityTimeout: "10",
};

const deleteParams = {
  Entries: [
    /* an array of messages */
  ],
  QueueUrl: SQS_URL /* required */,
};

const getBatch = async (sqs, queueParams) => {
  try {
    return await sqs.receiveMessage(queueParams).promise();
  } catch (e) {
    console.log(e);
  }
};

const writeMessages = async (dbClient, params) => {
  try {
    await dbClient.batchWrite(params).promise();
  } catch (e) {
    console.log(e);
  }
};

const deleteMessages = async (sqsClient, params) => {
  try {
    await sqsClient.deleteMessageBatch(params).promise();
  } catch (e) {
    console.log(e);
  }
};

exports.handler = async function (event) {
  let count = 0;
  let iterations = Number(event.iterations);

  do {
    let sqsData = await getBatch(sqsClient, queueParams);

    if (!sqsData.Messages) {
      console.log("nothing yet");
      return;
    }

    let users = [];
    let entries = [];

    /* populate users and entries using sqsData */
    sqsData.Messages.forEach((message) => {
      entries.push({
        Id: message.MessageId,
        ReceiptHandle: message.ReceiptHandle,
      });

      users.push({
        PutRequest: {
          Item: {
            date: Date.now(),
            usertoken: message.Body,
            allow: true,
          },
        },
      });
    });

    deleteParams.Entries = entries;

    let writeParams = {
      RequestItems: {
        [TABLE_NAME]: users,
      },
    };

    await writeMessages(docClient, writeParams);
    await deleteMessages(sqsClient, deleteParams);

    count += 1;
  } while (count < iterations);
};
