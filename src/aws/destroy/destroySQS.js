const { SQSClient, DeleteQueueCommand, GetQueueUrlCommand } = require("@aws-sdk/client-sqs");



const logger = require("../../utils/logger")("commands:destroyQueue");

const getQueueUrl = async (queue, name) => {
  const params = {
    QueueName: name
  }

  const command = new GetQueueUrlCommand(params);

  try {
    let { QueueUrl: queueUrl } = await queue.send(command);
    logger.log("Successfully found queue URL:", queueUrl)
    return queueUrl;
  } catch (error) {
    logger.warning("Error", error);
  }
}

const destroyQueue = async (queue, queueName) => {
  let urlName = await getQueueUrl(queue, queueName);

  const params = {
    QueueUrl: urlName,
  };

  const command = new DeleteQueueCommand(params);

  try {
    await queue.send(command);
    logger.log(`Successfully deleted queue: ${queueName}`);
  } catch (err) {
    logger.warning("Error", err);
  }
}

module.exports = async (region, queueName) => {
  const queue = new SQSClient({ region });

  // Destroy queue
  await destroyQueue(queue, queueName);
};
