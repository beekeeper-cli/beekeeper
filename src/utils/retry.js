const logger = require('./logger')('commands:Retries');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const MAX_RETIRES = 3;

let retries = 1;
let retry = true;

module.exports = async (func) => {
  let value;

  try {
    do {
      let { status, response } = await func();
      value = response;
  
      switch (status) {
        case "Success":
          retry = false;
          break;
        case "Trottled":
          retry = true;
        default:
          retry = true;
          console.log('retry attempt: ', retries)
          break;
      }
    
      retries = retries += 1;
      await delay(retries * 500);
    } while (retry && retries <= MAX_RETIRES);
    
    if (retries > MAX_RETIRES) {
      throw new Error("RetryFailed");
    } else {
      return value;
    }
  } catch (error) {
    logger.warning(error);
    return value;
  }

}