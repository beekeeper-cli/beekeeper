// We might need to reset permissions? - per Iron Man

const { LambdaClient, CreateFunctionCommand } = require("@aws-sdk/client-lambda");
const logger = require('../../utils/logger')('commands:deployPreLambda');
const fs = require('fs');

const createPreLambda = async (lambda, lambdaName, sqsUrl, code, roleArn, region, bucketUrl) => {
  const params = {
    FunctionName: lambdaName,
    Role: roleArn,
    Handler: "index.handler",
    Runtime: "nodejs12.x",
    Description: "producerLambda",
    Environment: {
      Variables: {
        "SQS_URL": sqsUrl,
        "REGION": region, 
        "BUCKET_URL": bucketUrl,
      }
    },
    Code: { ZipFile: code }
  };

  const command = new CreateFunctionCommand(params);

  try {
    const {FunctionArn} = await lambda.send(command);
    logger.log(`Successfully created PreLambda: ${FunctionArn}`);
    return FunctionArn;
  } catch (err) {
    logger.warning("Error", err);
  }
}


module.exports = async (region, lambdaName, sqsUrl, asset, roleArn, bucketUrl) => {
  let code = fs.readFileSync(asset);

  // Create a Lambda client service object
  const lambda = new LambdaClient({ region });

  // Create pre lambda
  const lambdaArn = await createPreLambda(lambda, lambdaName, sqsUrl, code, roleArn, region, bucketUrl);
  return lambdaArn;
};