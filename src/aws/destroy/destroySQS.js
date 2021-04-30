/**
 * Exports an async function that tears down a SQS
 * @module destroySQS
 */
const { SQSClient, DeleteQueueCommand, GetQueueUrlCommand } = require("@aws-sdk/client-sqs");
const logger = require("../../utils/logger")("dev");

/**
 * Gets the SQS URL
 * @param {SQSClient} queue This is the SQS Client
 * @param {String} name This is the name of the SQS
 * @returns {String} This is the queue URL
 * @throws Will throw an error if SQS client fails to execute its command
 */
const getQueueUrl = async (queue, name) => {
  const params = {
    QueueName: name
  }

  const command = new GetQueueUrlCommand(params);

  try {
    let { QueueUrl: queueUrl } = await queue.send(command);
    logger.debugSuccess("Successfully found queue URL:", queueUrl)
    return queueUrl;
  } catch (error) {
    logger.debugError("Error", error);
  }
}

/**
 * Tears down a SQS
 * @param {SQSClient} queue This is the SQS client
 * @param {String} queueName This is the name of the SQS
 * @throws Will throw an error if SQS client fails to execute its command
 */
const destroyQueue = async (queue, queueName) => {
  let urlName = await getQueueUrl(queue, queueName);

  const params = {
    QueueUrl: urlName,
  };

  const command = new DeleteQueueCommand(params);

  try {
    await queue.send(command);
    logger.debugSuccess(`Successfully deleted queue: ${queueName}`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
}

/**
 * Exports destroySQS
 * @param {String} region This is the region of where this AWS service is deployed
 * @param {String} queueName This is the name of the SQS
 */
module.exports = async (region, queueName) => {
  const queue = new SQSClient({ region });

  await destroyQueue(queue, queueName);
};
