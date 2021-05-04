/** 
 * xports a function which uses exponential backoff to retry a throttled asynchronous function multiple times.
 * @module retry 
 * @example
 * const retry = require('./retry');
 * @example <caption>one line</caption>
 * (await retry(() => myThrottledFunction()))();
 * @example <caption>multi-line</caption>
 * (await retry(() => {
 *    myThrottledFunction()
 *  })
 * )();
 */

const logger = require("./logger")("dev");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const MAX_RETRIES = 3;

/**
 * Exports the retry function.
 * @params {Function}
 * @returns {Promise}
 */
module.exports = async (func) => {
  let value;
  let retries = 0;
  let retry = true;

  try {
    while (retry && retries <= MAX_RETRIES) {
      let { status, response } = await func();
      value = response;

      switch (status) {
        case "Success":
          retry = false;
          break;
        case "Throttled":
          retry = true;
          break;
        default:
          retry = true;
          console.log(" retry attempt: ", retries);
          break;
      }

      await delay(2**retries * 200);
      retries += 1;
    }

    if (retries > MAX_RETRIES) {
      throw new Error("RetryFailed");
    } else {
      return value;
    }
  } catch (err) {
    logger.debugError(err)
    throw new Error(err);
  }
};
