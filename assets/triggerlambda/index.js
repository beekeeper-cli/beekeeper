const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.REGION });
const lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });
const RATE = Number(process.env.RATE);
const POST_LAMBDA_ARN = process.env.POST_LAMBDA_ARN;

exports.handler = async (event) => {
  for (let i = 0; i < RATE; i += 100) {

    let iterations = RATE - i > 100 ? 100 : RATE - i;

    const params = {
      FunctionName: POST_LAMBDA_ARN,
      InvocationType: "Event",
      Payload: JSON.stringify({iterations})
    }

    try {
      await lambda.invoke(params).promise();
    } catch (err) {
      console.log(err)
    }
    
  }
}